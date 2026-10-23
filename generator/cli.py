import argparse
import sys
from pathlib import Path

from backend.repository import JsonRepository
from generator.manual import create_batch_request, create_topics_request, import_pack, validate_pack
from generator.static_export import export_static


def main(argv: list[str] | None = None) -> None:
    argv = list(sys.argv[1:] if argv is None else argv)
    if argv and argv[0].isdigit():
        create_request(int(argv[0]))
        return

    parser = argparse.ArgumentParser(description="Prepare and import Culture365 manual content packs.")
    subparsers = parser.add_subparsers(dest="command", required=True)
    subparsers.add_parser("init", help="Create the topic-list request file.")

    request = subparsers.add_parser("request", help="Create a Codex request for lesson content.")
    request.add_argument("--count", type=int, default=14)
    request.add_argument("--start", type=int)

    validate = subparsers.add_parser("validate", help="Validate a manual content pack without importing it.")
    validate.add_argument("path")

    import_command = subparsers.add_parser("import", help="Validate and import a manual content pack.")
    import_command.add_argument("path")

    subparsers.add_parser("status", help="Show local generation status.")

    export = subparsers.add_parser("export-static", help="Export imported lessons for an offline static PWA.")
    export.add_argument("--days", type=int, help="Number of generated days to export.")
    export.add_argument("--include-dist", action="store_true", help="Also copy exported content into frontend/dist if it exists.")

    args = parser.parse_args(argv)
    if args.command == "init":
        init_project()
    elif args.command == "request":
        create_request(args.count, args.start)
    elif args.command == "validate":
        pack = validate_pack(Path(args.path))
        print(summary("Validated", pack))
    elif args.command == "import":
        pack = import_pack(Path(args.path), JsonRepository())
        print(summary("Imported", pack))
    elif args.command == "status":
        show_status()
    elif args.command == "export-static":
        state = export_static(args.days, args.include_dist)
        print(f"Exported {len(state['generated_days'])} days for static offline use.")
        print("Next: cd frontend && npm run build")


def init_project() -> None:
    repo = JsonRepository()
    repo.ensure_dirs()
    path = create_topics_request(repo)
    print(f"Created {path}")
    print("Ask Codex to fill it, then run: python generate.py import data/inbox/topics.json")


def create_request(count: int, start: int | None = None) -> None:
    repo = JsonRepository()
    try:
        path = create_batch_request(repo, count, start)
    except (FileNotFoundError, ValueError) as exc:
        raise SystemExit(str(exc)) from exc
    print(f"Created {path}")
    print("Ask Codex to create the JSON pack named inside that request, then import it.")


def show_status() -> None:
    status = JsonRepository().status()
    print(f"Current day: {status.current_day}")
    print(f"Last fully imported day: {status.last_generated_day}")
    print(f"Generated days: {', '.join(map(str, status.generated_days)) or 'none'}")


def summary(action: str, pack: object) -> str:
    countries = len(getattr(pack, "countries", None) or [])
    questions = len(getattr(pack, "questions", None) or [])
    days = len(getattr(pack, "days", []))
    parts = []
    if countries:
        parts.append(f"{countries} countries/regions")
    if questions:
        parts.append(f"{questions} questions")
    if days:
        parts.append(f"{days} days")
    return f"{action}: {', '.join(parts)}."
