import logging
import sys
from typing import Optional
 
class AnsiColor:
    RESET    = "\033[0m"
    BOLD     = "\033[1m"
    CYAN     = "\033[36m"
    GREEN    = "\033[32m"
    ORANGE   = "\033[33m"    
    RED      = "\033[31m"
    BOLD_RED = "\033[1;31m"
 
 
    ORANGE_256 = "\033[38;5;208m"
 
 
#    Level -> color mapping  
 
LEVEL_COLORS: dict[int, str] = {
    logging.DEBUG:    AnsiColor.CYAN,
    logging.INFO:     AnsiColor.GREEN,
    logging.WARNING:  AnsiColor.ORANGE_256,
    logging.ERROR:    AnsiColor.RED,
    logging.CRITICAL: AnsiColor.BOLD_RED,
}
 
LEVEL_LABELS: dict[int, str] = {
    logging.DEBUG:    "DEBUG   ",
    logging.INFO:     "INFO    ",
    logging.WARNING:  "WARNING ",
    logging.ERROR:    "ERROR   ",
    logging.CRITICAL: "CRITICAL",
}
 
 
#  Custom formatter  
 
class AegisColorFormatter(logging.Formatter):
    """
    Formats log records with ANSI colors and a consistent structure:
 
        [LEVEL   ] [timestamp] [logger_name] message
    """
 
    DATE_FORMAT = "%Y-%m-%d %H:%M:%S"
 
    def format(self, record: logging.LogRecord) -> str:
        color = LEVEL_COLORS.get(record.levelno, AnsiColor.RESET)
        label = LEVEL_LABELS.get(record.levelno, record.levelname)
        reset = AnsiColor.RESET
 
        timestamp = self.formatTime(record, self.DATE_FORMAT)
        logger_name = record.name
 
        # Format the base message
        message = record.getMessage()
 
        # Append exception info if present
        if record.exc_info:
            if not record.exc_text:
                record.exc_text = self.formatException(record.exc_info)
        if record.exc_text:
            message = f"{message}\n{record.exc_text}"
 
        # Append stack info if present
        if record.stack_info:
            message = f"{message}\n{self.formatStack(record.stack_info)}"
 
        return (
            f"{color}[{label}]{reset} "
            f"[{timestamp}] "
            f"[{logger_name}] "
            f"{message}"
        )
 
 
class PlainFormatter(logging.Formatter):
    """
    Plain formatter without ANSI codes.
    Used when logging to file or when the environment has no TTY.
    """
 
    DATE_FORMAT = "%Y-%m-%d %H:%M:%S"
    FORMAT = "[{levelname:<8}] [{asctime}] [{name}] {message}"
 
    def __init__(self) -> None:
        super().__init__(fmt=self.FORMAT, datefmt=self.DATE_FORMAT, style="{")
 
 
#  Setup function 
 
def setup_logging(
    level: Optional[str] = None,
    log_file: Optional[str] = None,
    force_plain: bool = False,
) -> None:
    """
    Configures the root logger for the entire application.
    Must be called once at startup before creating the FastAPI instance.
 
    Args:
        level      : log level string ("debug", "info", "warning", "error").
                     Defaults to settings.app_log_level if not provided.
        log_file   : optional path to write logs to a file in plain format.
        force_plain: disables ANSI colors even on TTY (useful for CI).
 
    Usage in main.py:
        from app.core.logging import setup_logging
        setup_logging()
    """
    from app.core.config import get_settings
    settings = get_settings()
 
    log_level_str = (level or settings.app_log_level).upper()
    log_level = getattr(logging, log_level_str, logging.INFO)
 
    root_logger = logging.getLogger()
    root_logger.setLevel(log_level)
 
    # Remove existing handlers to avoid duplicate output
    root_logger.handlers.clear()
 
    # Detect whether the output supports ANSI codes
    use_colors = (
        not force_plain
        and hasattr(sys.stdout, "isatty")
        and sys.stdout.isatty()
        # Docker always pipes stdout, so isatty() returns False.
        # Force colors in Docker by checking the env explicitly.
        or _is_docker()
    )
 
    #  Console handler 
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(log_level)
    console_handler.setFormatter(
        AegisColorFormatter() if use_colors else PlainFormatter()
    )
    root_logger.addHandler(console_handler)
 
    #   File handler (optional) 
    if log_file:
        
        file_handler = logging.FileHandler(log_file, encoding="utf-8")
        file_handler.setLevel(log_level)
        file_handler.setFormatter(PlainFormatter())
        root_logger.addHandler(file_handler)
 
    # Silence noisy third-party loggers
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("sqlalchemy.engine").setLevel(
        logging.INFO if settings.is_development else logging.WARNING
    )
    logging.getLogger("onnxruntime").setLevel(logging.WARNING)
    logging.getLogger("multipart").setLevel(logging.WARNING)
 
    logging.getLogger("aegis").info(
        "Logging initialized — level: %s | colors: %s | file: %s",
        log_level_str,
        use_colors,
        log_file or "disabled",
    )
 
 
def _is_docker() -> bool:
    """
    Detects whether the process is running inside a Docker container.
    Used to force colored output in Docker even when stdout is piped.
    """
    try:
        with open("/proc/1/cgroup", "r") as f:
            return "docker" in f.read() or "containerd" in f.read()
    except (OSError, IOError):
        pass
    return False
 
 

logger = logging.getLogger("aegis.core")