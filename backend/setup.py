import os
from setuptools import setup, find_packages


def read(fname):
    return open(os.path.join(os.path.dirname(__file__), fname)).read()


setup(
    name="dummy_server",
    version="0.0.1",
    description="Backend for the dummy project of the XAI-IML 2023 course.",
    long_description=read("README.md"),
    package_data={
        "": [
            "dataset_games.csv",
            "dataset_games_details.csv",
            "dataset_players.csv",
            "dataset_ranking.csv",
            "dataset_teams.csv",
        ]
    },
    data_files=[(
        "data", [
            os.path.join("data", "dataset_games.csv"),
            os.path.join("data", "dataset_games_details.csv"),
            os.path.join("data", "dataset_players.csv"),
            os.path.join("data", "dataset_ranking.csv"),
            os.path.join("data", "dataset_teams.csv"),
        ]
    )],
    classifiers=[
        "Intended Audience :: Developers",
        "Natural Language :: English",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.9",
        "Development Status :: 4 - Beta",
    ],
    entry_points={
        "console_scripts": [
            "start-server = dummy_server.router.app:start_server",
        ]
    },
    install_requires=[
        "Flask>=2.0.0",
        "flask-restful>=0.3.9,<0.4",
        "flask-cors>=3.0.10,<3.1",
        "pandas==1.4.4",
        "scikit-learn>=1.0.2,<1.1",
        "numpy==1.23.1",
        "lightgbm==3.3.5",
        "shap==0.41.0",
        "matplotlib==3.7.1",
    ],
    packages=find_packages(where="src", include=["dummy_server*"]),
    package_dir={"": "src"},
)
