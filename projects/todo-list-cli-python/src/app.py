"""A small, persistent command-line todo list using only Python's stdlib."""

from __future__ import annotations

import csv
from pathlib import Path


TODOS_FILE = Path("todos.csv")
todos: list[str] = []


def add_one_task(title: str) -> int:
    """Add a non-empty task and return its one-based list position."""
    cleaned_title = title.strip()
    if not cleaned_title:
        raise ValueError("A task title cannot be empty.")

    todos.append(cleaned_title)
    save_todos()
    return len(todos)


def print_list() -> None:
    """Print every task with the numeric position used for deletion."""
    if not todos:
        print("Your todo list is empty.")
        return

    print("\nYour tasks:")
    for position, title in enumerate(todos, start=1):
        print(f"{position}. {title}")


def delete_task(number_to_delete: int) -> str:
    """Delete a task by its one-based position and return its title."""
    if number_to_delete < 1 or number_to_delete > len(todos):
        raise IndexError("Choose a task number shown in the list.")

    removed_title = todos.pop(number_to_delete - 1)
    save_todos()
    return removed_title


def save_todos() -> None:
    """Persist the current task list to ``todos.csv``."""
    with TODOS_FILE.open("w", newline="", encoding="utf-8") as csv_file:
        writer = csv.writer(csv_file)
        writer.writerow(["title"])
        writer.writerows([title] for title in todos)


def load_todos() -> list[str]:
    """Load tasks from ``todos.csv`` and return the in-memory list."""
    todos.clear()
    if not TODOS_FILE.exists():
        return todos

    with TODOS_FILE.open(newline="", encoding="utf-8") as csv_file:
        reader = csv.DictReader(csv_file)
        if reader.fieldnames != ["title"]:
            raise ValueError("todos.csv must contain a single 'title' column.")
        for row in reader:
            title = (row.get("title") or "").strip()
            if title:
                todos.append(title)
    return todos


def _read_task_number() -> int:
    raw_number = input("Task number to delete: ").strip()
    if not raw_number.isdigit():
        raise ValueError("Enter a whole number from the list.")
    return int(raw_number)


def main() -> None:
    """Run the interactive menu until the user chooses to exit."""
    try:
        load_todos()
    except (OSError, ValueError) as error:
        print(f"Could not load todos: {error}")
        return

    actions = {
        "1": "Add a task",
        "2": "View tasks",
        "3": "Delete a task",
        "4": "Exit",
    }

    while True:
        print("\nTodo List")
        for key, label in actions.items():
            print(f"{key}. {label}")

        choice = input("Choose an option: ").strip()
        try:
            if choice == "1":
                position = add_one_task(input("Task title: "))
                print(f"Task {position} added.")
            elif choice == "2":
                print_list()
            elif choice == "3":
                print_list()
                if todos:
                    removed = delete_task(_read_task_number())
                    print(f"Deleted: {removed}")
            elif choice == "4":
                print("Goodbye!")
                return
            else:
                print("Choose 1, 2, 3, or 4.")
        except (IndexError, OSError, ValueError) as error:
            print(f"Unable to complete that action: {error}")


if __name__ == "__main__":
    main()
