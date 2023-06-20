import os
import pickle

import lightgbm as lgb
import numpy as np
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.decomposition import PCA
from sklearn.preprocessing import StandardScaler

# global constants
DATA_ROOT = os.path.realpath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "data"))

PRED_COLS = ['AST', 'BLK', 'DREB', 'FG3A', 'FGA', 'FTA', 'OREB', 'STL', 'TO']
CLUSTERING_PRED = ["OR", "DR"]

REGULAR_SEASON_DURATION = {
    2021: ('2021-10-19', '2022-04-10'),
    2020: ('2020-12-22', '2021-05-16'),
    2018: ('2018-10-16', '2019-04-10'),
    2017: ('2017-10-17', '2018-04-11'),
}

def load_new_stat_classifier(path_to_model_str: str = os.path.join(DATA_ROOT, 'precomputed', 'classifier_new_stats.txt')):
    """
    Load sitred lgbm model with new stats
    """
    # read model string from disk
    with open(path_to_model_str, 'r') as f:
        model_str = f.read()

    # load lightgbm booster from model string
    clf  = lgb.Booster(model_str=model_str)

    return clf


def load_tree_explainer(path_to_tree_explainer: str = os.path.join(DATA_ROOT, 'precomputed', 'TreeExplainer_new_stats.pkl')):
    """
    Load stored SHAP TreeExplainer of the lightgbm model
    """

    with open(path_to_tree_explainer, 'rb') as f:
        explainer = pickle.load(f)

    return explainer


def get_team_boxscore(team_id=1610612738, is_home=True) -> pd.DataFrame:
    """
    Calculate aggregated team boxscores from raw datasets
    """

    games = pd.read_csv(os.path.join(DATA_ROOT, 'dataset_games.csv'))
    games_details = pd.read_csv(os.path.join(DATA_ROOT, 'dataset_games_details.csv'))

    # join games to games_details for date information
    games_details = games_details.merge(games, on='GAME_ID')

    # add additional column indicating whether team is home or not
    games_details['is_home'] = games_details['TEAM_ID'] == games_details['TEAM_ID_home']

    # select data from team at home or away
    games_details = games_details[(games_details['TEAM_ID']==team_id) & (games_details['is_home']==is_home)][PRED_COLS+['GAME_ID']]

    # sum over all players for each game and then average over all games
    boxscore = games_details.groupby(['GAME_ID']).sum().mean().to_frame().T
    
    return boxscore

def calculate_ratings(boxscore): 
    boxscore_ratings = boxscore.copy()
    for index, row in boxscore_ratings.iterrows():
        boxscore_ratings.loc[index, "point"] = 2 * (row["FGM"] + 0.5 * row["FG3M"]) + row["FTM"]
        boxscore_ratings.loc[index, "possession"] = 0.5 * (row["FGA"] + 0.475 * row["FTA"] - row["OREB"] + row["TO"])
    
    mean_possession = boxscore_ratings["possession"].mean()

    for index, row in boxscore_ratings.iterrows():
        # Offensive Rating (OR) = 100 / (TmPoss + OppPoss) * Pts
        boxscore_ratings.loc[index, "OR"] = (100 * row["point"]) / (row["possession"] + mean_possession)
        
        boxscore_ratings.loc[index, "DR"] = 100 * (row["BLK"] + row["DREB"] + row["STL"]) / (row["possession"] + mean_possession)

    boxscore_ratings.drop("is_home", axis =1 ,inplace= True)
    return boxscore_ratings.groupby("TEAM_ID",as_index=False).mean()

def calculate_custom_ratings(boxscore, boxscore_all_teams):

    mean_FG_percentage = boxscore_all_teams["FGM"].mean()/boxscore_all_teams["FGA"].mean()
    mean_3FG_percentage = boxscore_all_teams["FG3M"].mean()/boxscore_all_teams["FG3A"].mean()
    mean_FT_percentage = boxscore_all_teams["FTM"].mean()/boxscore_all_teams["FTA"].mean()
    mean_possession = boxscore_all_teams["possession"].mean()

    boxscore_ratings = boxscore.copy()
    for index, row in boxscore_ratings.iterrows():
        boxscore_ratings.loc[index, "point"] = 2 * (row["FGA"] * mean_FG_percentage + 0.5 * row["FG3A"] *  mean_3FG_percentage) + (row["FTA"]* mean_FT_percentage)
        boxscore_ratings.loc[index, "possession"] = 0.5 * (row["FGA"] + 0.475 * row["FTA"] - row["OREB"] + row["TO"])
    
    for index, row in boxscore_ratings.iterrows():
        # Offensive Rating (OR) = 100 / (TmPoss + OppPoss) * Pts
        boxscore_ratings.loc[index, "OR"] = (100 * row["point"]) / (row["possession"] + mean_possession)
        
        boxscore_ratings.loc[index, "DR"] = 100 * (row["BLK"] + row["DREB"] + row["STL"]) / (row["possession"] + mean_possession)

    boxscore_ratings.drop("is_home", axis =1 ,inplace= True)
    return boxscore_ratings.groupby("TEAM_ID",as_index=False).mean()
    


def get_season_games(season=2021):
    games = pd.read_csv(os.path.join(DATA_ROOT, 'dataset_games.csv'))
    
    regular_games = games[(REGULAR_SEASON_DURATION[season][0] <= pd.to_datetime(games['GAME_DATE_EST'])) & (pd.to_datetime(games['GAME_DATE_EST']) <= REGULAR_SEASON_DURATION[season][1])]
    
    return regular_games


def closest_point(point, points):
    deltas = points - point
    dist_2 = np.einsum('ij,ij->i', deltas, deltas)
    return np.argmin(dist_2)