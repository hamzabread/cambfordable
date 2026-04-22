"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

let zoomGlobalLock = false;

export default function ZoomProvider({ meetingData }: { meetingData: any }) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const meetingSDKElement = useRef<HTMLDivElement>(null);
  const clientRef = useRef<any>(null);

  // 1. Fetch Auth State to determine isAdmin
  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("access_token");
      if (!token) {
        router.push("/login");
        return;
      }

      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/auth/me`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        setUser(response.data);
      } catch (err) {
        localStorage.removeItem("access_token");
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [router]);

  // Determine admin status from the /auth/me response
  const isAdmin = user?.is_admin === true;

  useEffect(() => {
    // Only proceed if we have user data, meeting data, and no lock
    if (
      loading ||
      !user ||
      !meetingData?.signature ||
      !meetingSDKElement.current ||
      zoomGlobalLock
    )
      return;

    const setupZoom = async () => {
      try {
        zoomGlobalLock = true;
        const ZoomEmbedMod = await import("@zoom/meetingsdk/embedded");
        const ZoomMtgEmbedded =
          ZoomEmbedMod.ZoomMtgEmbedded || ZoomEmbedMod.default || ZoomEmbedMod;

        if (!clientRef.current) {
          clientRef.current = ZoomMtgEmbedded.createClient();
        }

        const client = clientRef.current;
        const mNumber = String(meetingData.meeting_id).replace(/\s/g, "");
        const sKey = String(meetingData.sdk_key).trim();
        const sig = String(meetingData.signature).trim();
        const pass = meetingData.password ? String(meetingData.password) : "";

        await client.init({
          zoomAppRoot: meetingSDKElement.current,
          language: "en-US",
          patchJsMedia: true,
          leaveUrl: `${window.location.origin}/courses`,
          appKey: sKey,
          customize: {
            meeting_info: isAdmin
              ? ["topic", "host", "participant_number"]
              : [],
            toolbar: {
              buttons: [
                { name: "participants", visible: isAdmin },
                { name: "share", visible: isAdmin },
                { name: "chat", visible: true },
                { name: "leave", visible: true },
              ],
            },
            video: {
              isUserDecode: true,
              viewSizes: {
                default: {
                  width: window.innerWidth,
                  height: window.innerHeight,
                },
                screenShare: {
                  width: window.innerWidth,
                  height: window.innerHeight,
                },
              },
              isSpeakerView: true,
              isResizable: false,
              viewType: "gallery",
            },
            chat: isAdmin
              ? {}
              : {
                  // Students can only chat with host
                  allowPrivateChat: false,
                },
            screenShare: isAdmin
              ? {}
              : {
                  // Students cannot share screen
                  sharePermission: false,
                },
          },
        });

        await client.join({
          signature: sig,
          meetingNumber: mNumber,
          password: pass,
          userName: user.full_name || user.username,
          userEmail: user.email,
        });

        // Speaker view is already set in video config above
        // No need to call setVideoLayout as it's not a standard API method

        client.on("connection-change", (payload: any) => {
          if (payload.state === "Closed" || payload.state === "Terminated") {
            zoomGlobalLock = false;
            // Instead of redirecting the current tab, we close it
            window.close();
            // Note: window.close() only works if the tab was opened via window.open()
          }
        });
      } catch (error: any) {
        console.error("Zoom Error:", error);
        if (error.type !== "ALREADY_JOINED") zoomGlobalLock = false;
      }
    };

    setupZoom();
    return () => {
      zoomGlobalLock = false;
    };
  }, [meetingData, isAdmin, loading, user]);

  const enterFullScreen = () => {
    const elem = document.documentElement;
    if (elem.requestFullscreen) elem.requestFullscreen();
  };

  if (loading)
    return (
      <div className="bg-black h-screen w-screen flex items-center justify-center text-white">
        Loading Class...
      </div>
    );

  return (
    <div className="fixed inset-0 z-50 bg-black w-screen h-screen overflow-hidden">
      <style
        dangerouslySetInnerHTML={{
          __html: `
          #zmmtg-root { 
            pointer-events: auto !important; 
            width: 100% !important;
            height: 100% !important;
            background-color: #104278 !important;
          }

          #zmmtg-root .meeting-app,
          #zmmtg-root .meeting-client,
          #zmmtg-root .meeting-container,
          #zmmtg-root .main-layout,
          #zmmtg-root .video-container,
          #zmmtg-root .share-view-container,
          #zmmtg-root .screen-share-container {
            background-color: #104278 !important;
          }

          #zmmtg-root .meeting-footer { 
            display: flex !important; 
            visibility: visible !important; 
            pointer-events: auto !important; 
          }

          /* ===== SCREEN SHARE FULLSCREEN SETTINGS ===== */
          #zmmtg-root.zm-embedded.zm-screen-sharing-view .share-view-container,
          #zmmtg-root.zm-embedded.zm-screen-sharing-view [class*="share-view"],
          #zmmtg-root.zm-embedded.zm-screen-sharing-view .screen-share-container {
            width: 100% !important;
            height: 100% !important;
            max-width: 100% !important;
            max-height: 100% !important;
            flex: 1 !important;
            object-fit: contain !important;
          }

          /* Ensure screenshare and video containers take full screen */
          #zmmtg-root .share-view-container,
          #zmmtg-root .share-view,
          #zmmtg-root .screen-share-container,
          #zmmtg-root .screen-shared-container,
          #zmmtg-root .video-container,
          #zmmtg-root .meeting-container,
          #zmmtg-root [class*="share-view"],
          #zmmtg-root [class*="screen"] {
            width: 100% !important;
            height: 100% !important;
            max-width: 100% !important;
            max-height: 100% !important;
            object-fit: contain !important;
          }

          /* Ensure main video/content area is full screen */
          #zmmtg-root .video-js,
          #zmmtg-root .zm-video-container,
          #zmmtg-root video {
            width: 100% !important;
            height: 100% !important;
            object-fit: contain !important;
          }

          /* Hide participant gallery during screen share for cleaner view */
          #zmmtg-root.zm-screen-sharing-view .gallery-layout,
          #zmmtg-root.zm-screen-sharing-view .filmstrip-container,
          #zmmtg-root.zm-screen-sharing-view [class*="participant-video"] {
            display: none !important;
          }
          
          ${
            !isAdmin
              ? `
            /* ===== STUDENT VIEW: HIDE ALL PARTICIPANT INFO ===== */
            
            /* Hide participant count badge */
            #zmmtg-root .header-info-participant-number,
            #zmmtg-root .footer-button__participants-indicator,
            #zmmtg-root [class*="participant-count"],
            
            /* Hide participants panel/sidebar */
            #zmmtg-root .footer-button__participants-container,
            #zmmtg-root .sidebar-container,
            #zmmtg-root .participant-list-container,
            #zmmtg-root .participants-button,
            #zmmtg-root .participant-panel-container,
            
            /* Hide gallery/participant video views */
            #zmmtg-root .item-list__gallery-view,
            #zmmtg-root .gallery-layout,
            #zmmtg-root .gallery-video-container,
            #zmmtg-root .gallery-item,
            #zmmtg-root .gallery-cell,
            
            /* Hide filmstrip (participant videos at bottom) */
            #zmmtg-root .filmstrip-video-container,
            #zmmtg-root .filmstrip-container,
            #zmmtg-root [class*="filmstrip"],
            
            /* Hide speaker view sidebar with participant list */
            #zmmtg-root .speaker-view-sidebar,
            #zmmtg-root .speaker-non-video-area,
            
            /* Hide other participant indicators */
            #zmmtg-root .avatar-wrapper[class*="participant"],
            #zmmtg-root [class*="video-container"][class*="remote"],
            #zmmtg-root .remote-video-container,
            
            /* Hide names/labels of other participants */
            #zmmtg-root .video-label,
            #zmmtg-root [class*="video-name"],
            #zmmtg-root .participant-display-name,
            
            /* Hide any view switching buttons that show participant list */
            #zmmtg-root .view-app-btn,
            #zmmtg-root [class*="layout-button"],
            #zmmtg-root [class*="view-switch"]
            {
              display: none !important;
              visibility: hidden !important;
              pointer-events: none !important;
              height: 0 !important;
              width: 0 !important;
              margin: 0 !important;
              padding: 0 !important;
              border: none !important;
            }

            /* Ensure teacher/admin video takes full screen */
            #zmmtg-root .active-video-container,
            #zmmtg-root .single-video-container,
            #zmmtg-root .speaker-video-container {
              width: 100% !important;
              height: 100% !important;
              display: flex !important;
              visibility: visible !important;
            }

            /* Hide participant list in header */
            #zmmtg-root .meeting-header [class*="participant"],
            #zmmtg-root .header-participant-count {
              display: none !important;
            }

            /* Ensure video stream is maximized */
            #zmmtg-root .video-js,
            #zmmtg-root video {
              width: 100% !important;
              height: 100% !important;
              object-fit: contain !important;
            }

          `
              : `
            /* ===== ADMIN/TEACHER VIEW: SHOW ALL CONTROLS ===== */
            
            #zmmtg-root .sidebar-container,
            #zmmtg-root .participant-list-container,
            #zmmtg-root .participant-panel-container,
            #zmmtg-root .footer-button__participants-container,
            #zmmtg-root .header-info-participant-number {
               visibility: visible !important;
               display: block !important;
               pointer-events: auto !important;
               z-index: 1000 !important;
            }

            /* Show participant count */
            #zmmtg-root .footer-button__participants-indicator,
            #zmmtg-root [class*="participant-count"] {
              display: block !important;
              visibility: visible !important;
            }
          `
          }

          /* Universal fixes for both views */
          #zmmtg-root button {
            background-color: transparent;
            text-transform: none;
          }

          #zmmtg-root .meeting-footer button {
            display: flex !important;
            visibility: visible !important;
          }

          /* Ensure footer buttons are clickable */
          #zmmtg-root .footer-button__leave {
            pointer-events: auto !important;
          }
        `,
        }}
      />

      <div className="absolute top-4 right-4 z-50">
        <button
          onClick={enterFullScreen}
          className="bg-white/10 hover:bg-white/20 text-white p-2.5 rounded-full backdrop-blur-md border border-white/20"
        >
          ⛶
        </button>
      </div>

      <div id="zmmtg-root" ref={meetingSDKElement} className="w-full h-full" />
    </div>
  );
}
