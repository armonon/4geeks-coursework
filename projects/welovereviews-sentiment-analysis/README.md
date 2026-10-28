# WeLoveReviews Sentiment Analysis

An auditable sentiment-analysis pipeline for 500 Harbor House Café customer
reviews. The project integrates the required pretrained multilingual BERT model,
compares written sentiment with the reported 4.5/5 average, and documents model
errors caused by the product-review-to-service-review domain mismatch.

## Verified result

- 500/500 reviews processed
- 82.4% positive, 8.2% neutral, and 9.4% negative model sentiment
- 95% agreement between human rating bands and predicted sentiment bands
- 16 high-rating false negatives identified and reviewed
- Model and Python dependencies pinned for reproducibility

The complete analytical story, charts, false-negative examples, and 20-row
manual sanity check are in the executed [`src/explore.ipynb`](src/explore.ipynb).
The production entry point is [`src/app.py`](src/app.py), and its enriched output
is [`data/processed/reviews_with_sentiment.csv`](data/processed/reviews_with_sentiment.csv).

## Run locally

Python 3.11 is recommended.

```bash
python3.11 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python src/app.py
pytest -q
```

The first production run downloads the pinned model to the normal Hugging Face
cache. Model weights are never stored in this repository.

## Rebuild the notebook

```bash
python scripts/build_notebook.py
jupyter nbconvert --to notebook --execute src/explore.ipynb \
  --output explore.ipynb --output-dir src --ExecutePreprocessor.timeout=600
```

## Project structure

```text
data/raw/reviews.csv                         provided source dataset
data/processed/reviews_with_sentiment.csv   complete auditable predictions
src/sentiment.py                            pinned reusable model integration
src/app.py                                  production CSV pipeline
src/explore.ipynb                           executed narrative analysis
tests/test_sentiment.py                     mapping, validation, and pipeline tests
```

## Model contract

- Model: `nlptown/bert-base-multilingual-uncased-sentiment`
- Revision: `8f6f4e3a8f70be4b65d3a4a8762b6d781cda240d`
- Mapping: 1–2 stars → negative, 3 → neutral, 4–5 → positive
- Input provenance: 4Geeks Academy AI Engineering syllabus

---

## Original template documentation

This boilerplate is designed to kickstart data science projects by providing a basic setup for database connections, data processing, and machine learning model development. It includes a structured folder organization for your datasets and a set of pre-defined Python packages necessary for most data science tasks.

## Structure

The project is organized as follows:

- **`src/app.py`** → Main Python script where your project will run.
- **`src/explore.ipynb`** → Notebook for exploration and testing. Once exploration is complete, migrate the clean code to `app.py`.
- **`src/utils.py`** → Auxiliary functions, such as database connection.
- **`requirements.txt`** → List of required Python packages.
- **`models/`** → Will contain your SQLAlchemy model classes.
- **`data/`** → Stores datasets at different stages:
  - **`data/raw/`** → Raw data.
  - **`data/interim/`** → Temporarily transformed data.
  - **`data/processed/`** → Data ready for analysis.


## ⚡ Initial Setup in Codespaces (Recommended)

No manual setup is required, as **Codespaces is automatically configured** with the predefined files created by the academy for you. Just follow these steps:

1. **Wait for the environment to configure automatically**.
   - All necessary packages and the database will install themselves.
   - The automatically created `username` and `db_name` are in the **`.env`** file at the root of the project.
2. **Once Codespaces is ready, you can start working immediately**.


## 💻 Local Setup (Only if you can't use Codespaces)

**Prerequisites**

Make sure you have Python 3.11+ installed on your machine. You will also need pip to install the Python packages.

**Installation**

Clone the project repository to your local machine.

Navigate to the project directory and install the required Python packages:

```bash
pip install -r requirements.txt
```

**Create a database (if necessary)**

Create a new database within the Postgres engine by customizing and executing the following command:

```bash
$ psql -U postgres -c "DO \$\$ BEGIN 
    CREATE USER my_user WITH PASSWORD 'my_password'; 
    CREATE DATABASE my_database OWNER my_user; 
END \$\$;"
```
Connect to the Postgres engine to use your database, manipulate tables, and data:

```bash
$ psql -U my_user -d my_database
```

Once inside PSQL, you can create tables, run queries, insert, update, or delete data, and much more!

**Environment Variables**

Create a .env file in the root directory of the project to store your environment variables, such as your database connection string:

```makefile
DATABASE_URL="postgresql://<USER>:<PASSWORD>@<HOST>:<PORT>/<DB_NAME>"

#example
DATABASE_URL="postgresql://my_user:my_password@localhost:5432/my_database"
```

## Running the Application

To run the application, execute the app.py script from the root directory of the project:

```bash
python src/app.py
```

## Adding Models

To add SQLAlchemy model classes, create new Python script files within the models/ directory. These classes should be defined according to your database schema.

Example model definition (`models/example_model.py`):

```py
from sqlalchemy.orm import declarative_base
from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

Base = declarative_base()

class ExampleModel(Base):
    __tablename__ = 'example_table'
    id: Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str] = mapped_column(unique=True)
```

## Working with Data

You can place your raw datasets in the data/raw directory, intermediate datasets in data/interim, and processed datasets ready for analysis in data/processed.

To process data, you can modify the app.py script to include your data processing steps, using pandas for data manipulation and analysis.

## Contributors

This template was built as part of the [Data Science and Machine Learning Bootcamp](https://4geeksacademy.com/us/coding-bootcamps/datascience-machine-learning) by 4Geeks Academy by [Alejandro Sanchez](https://twitter.com/alesanchezr) and many other contributors. Learn more about [4Geeks Academy BootCamp programs](https://4geeksacademy.com/us/programs) here.

Other templates and resources like this can be found on the school's GitHub page.
