import logging
import logging.handlers
import os
from typing import Optional
import json

try:
    # Rich is optional; if not installed, we fall back to standard logging
    from rich.logging import RichHandler  # type: ignore
    _HAS_RICH = True
except Exception:
    RichHandler = None  # type: ignore
    _HAS_RICH = False


def setup_logging(
    *,
    level: int | str = logging.INFO,
    log_file_path: Optional[str] = None,
    enable_console: bool = True,
    rotate_max_bytes: int = 10 * 1024 * 1024,
    rotate_backup_count: int = 5,
) -> None:
    """Configure root logger once with optional colored console and rotating file.

    - If `rich` is available, console logs are pretty with levels and time.
    - Keeps file rotation and UTF-8 encoding.
    - Idempotent: re-calling will not duplicate handlers.
    """

    root_logger = logging.getLogger()

    # Prevent duplicate handlers if called multiple times
    if getattr(root_logger, "_configured_by_utils_setup", False):
        return

    # Level
    if isinstance(level, str):
        level = getattr(logging, level.upper(), logging.INFO)
    root_logger.setLevel(level)

    # Ensure logs directory exists if file logging enabled
    if log_file_path:
        os.makedirs(os.path.dirname(log_file_path) or ".", exist_ok=True)

    # Common formatter for files; console handled by RichHandler/StreamHandler
    file_formatter = logging.Formatter(
        fmt="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )

    if log_file_path:
        file_handler = logging.handlers.RotatingFileHandler(
            log_file_path,
            maxBytes=rotate_max_bytes,
            backupCount=rotate_backup_count,
            encoding="utf-8",
        )
        file_handler.setFormatter(file_formatter)
        root_logger.addHandler(file_handler)

    if enable_console:
        if _HAS_RICH and RichHandler is not None:
            console_handler = RichHandler(
                rich_tracebacks=False,
                show_time=True,
                show_level=True,
                show_path=False,
                markup=False,
                log_time_format="%Y-%m-%d %H:%M:%S",
            )
            # RichHandler has its own formatting; keep message clean
        else:
            console_handler = logging.StreamHandler()
            console_handler.setFormatter(
                logging.Formatter(
                    fmt="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
                    datefmt="%Y-%m-%d %H:%M:%S",
                )
            )
        root_logger.addHandler(console_handler)

    # Mark configured
    setattr(root_logger, "_configured_by_utils_setup", True)


def get_logger(name: Optional[str] = None) -> logging.Logger:
    """Get a module-specific logger."""
    return logging.getLogger(name if name else __name__)


def log_kv(logger: logging.Logger, level: int, phase: str, **kwargs) -> None:
    """Structured logging helper: phase plus key-values."""
    try:
        payload = {"phase": phase, **kwargs}
        logger.log(level, json.dumps(payload, default=str))
    except Exception:
        logger.log(level, f"{phase} | {kwargs}")


