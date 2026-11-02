from logging.config import fileConfig

from alembic import context
from sqlalchemy import engine_from_config, pool

from database import Base, DATABASE_URL

# Import every mapped model so Alembic's metadata is complete for future
# autogeneration. These imports intentionally register model classes on Base.
from models import courses  # noqa: F401, E402
from models import enrollments  # noqa: F401, E402
from models import homeworks  # noqa: F401, E402
from models import live_class_messages  # noqa: F401, E402
from models import live_class_sessions  # noqa: F401, E402
from models import live_classes  # noqa: F401, E402
from models import class_attendance  # noqa: F401, E402
from models import course_threads  # noqa: F401, E402
from models import notifications  # noqa: F401, E402
from models import payments  # noqa: F401, E402
from models import payment_proof  # noqa: F401, E402
from models import quiz  # noqa: F401, E402
from models import quiz_attempt  # noqa: F401, E402
from models import quiz_answer  # noqa: F401, E402
from models import quiz_option  # noqa: F401, E402
from models import quiz_question  # noqa: F401, E402
from models import quiz_submission  # noqa: F401, E402
from models import users  # noqa: F401, E402


config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Alembic's Config parser treats percent signs as interpolation markers.
config.set_main_option("sqlalchemy.url", DATABASE_URL.replace("%", "%%"))
target_metadata = Base.metadata


def run_migrations_offline() -> None:
    context.configure(
        url=config.get_main_option("sqlalchemy.url"),
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
