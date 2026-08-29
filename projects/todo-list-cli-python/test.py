from app import delete_task, add_one_task, get_todos, save_todos, load_todos
import unittest
import csv


class TestTodoList(unittest.TestCase):
    def test_a_initialize(self):
        self.assertEqual(len(get_todos()), 0)

    def test_b_add(self):
        add_one_task("Make the bed")
        add_one_task("Make lunch")
        add_one_task("Clean kitchen")
        self.assertEqual(len(get_todos()), 3)

    def test_c_delete(self):
        delete_task(2)
        self.assertEqual(len(get_todos()), 2)
        self.assertEqual(get_todos()[0], "Make the bed")
        self.assertEqual(get_todos()[1], "Clean kitchen")

    def test_d_save(self):
        save_todos()
        with open("todos.csv", newline="", encoding="utf-8") as csv_file:
            saved_todos = [row[0] for row in csv.reader(csv_file)]
        self.assertEqual(get_todos(), saved_todos)

    def test_e_load(self):
        with open("todos.csv", "w", encoding="utf-8") as csv_file:
            csv_file.write("\n".join(["jump", "run", "roll"]))
        load_todos()
        self.assertEqual(get_todos(), ["jump", "run", "roll"])


if __name__ == "__main__":
    unittest.main()
