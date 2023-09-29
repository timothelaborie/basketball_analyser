import os

import numpy as np
import pandas as pd
from flask import jsonify, make_response, send_file
from flask_restful import Resource
from sklearn.preprocessing import StandardScaler

from .utils import DATA_ROOT, PRED_COLS, closest_point, get_season_games
import io


class GetTeamBoxscore(Resource):
    """Averaged statistics of each team in a given season. For query usage"""

    def get(self, team_id: int, is_home: int):
        # TODO: could have separate aggregations for whether team is home or away

        boxscores = pd.read_csv(os.path.join(DATA_ROOT, 'precomputed', 'boxscores.csv'), index_col=0)

        # filter precomputed boxscores
        team_boxscore = boxscores[(boxscores['TEAM_ID']==team_id) & (boxscores['is_home']==is_home)][PRED_COLS]

        return jsonify(team_boxscore.to_dict("records"))
    

class GetBoxscoresHome(Resource):
    """Averaged statistics of each team in a given season. For query usage"""

    def get(self):
        # TODO: could have separate aggregations for whether team is home or away

        boxscores = pd.read_csv(os.path.join(DATA_ROOT, 'precomputed', 'boxscores.csv'), index_col=0)

        # filter precomputed boxscores
        home_boxscores = boxscores[boxscores['is_home']][PRED_COLS]

        # build csv response
        csv = home_boxscores.to_csv(index=False)

        response = make_response(csv)
        response.headers['Content-Disposition'] = 'attachment; filename=boxscores_home.csv'
        response.headers['Content-Type'] = 'text/csv'

        return response
    

class GetBoxscoresAway(Resource):
    """Averaged statistics of each team in a given season. For query usage"""

    def get(self):
        # TODO: could have separate aggregations for whether team is home or away

        boxscores = pd.read_csv(os.path.join(DATA_ROOT, 'precomputed', 'boxscores.csv'), index_col=0)

        # filter precomputed boxscores
        away_boxscores = boxscores[~boxscores['is_home']][PRED_COLS]

        # build csv response
        csv = away_boxscores.to_csv(index=False)

        response = make_response(csv)
        response.headers['Content-Disposition'] = 'attachment; filename=boxscores_away.csv'
        response.headers['Content-Type'] = 'text/csv'

        return response
    

class GetTeamLogo(Resource):
    """Get team logo for any team ID"""

    def get(self, team_id: int):
        path = os.path.join(DATA_ROOT, "team_logos", f"{team_id}.png")

        with open(path, 'rb') as bites:
            return send_file(
                io.BytesIO(bites.read()),
                download_name='logo.png',
                mimetype='image/png'
            )
    

class GetTeams(Resource):
    """Get all team_ids"""

    def get(self):

        # load data
        games = pd.read_csv(os.path.join(DATA_ROOT, "dataset_games.csv"))
        teams = pd.read_csv(os.path.join(DATA_ROOT, "dataset_teams.csv"))

        # only use season 2021
        games = games[games['SEASON']==2021]
        team_info = teams[teams['TEAM_ID'].isin(games['TEAM_ID_home'].unique())]

        # add name column that concatenates city with nickname
        team_info['name'] = team_info.apply(lambda row: f"{row['CITY']} {row['NICKNAME']}", axis=1)

        # return team_id and name
        return jsonify(team_info[['TEAM_ID', 'name']].to_dict('records'))
    

class GetBoxscoreBounds(Resource):
    """Get lower and upper bounds for boxscore stats"""

    def get(self):
        
        # load precompouted boxscores
        boxscores = pd.read_csv(os.path.join(DATA_ROOT, 'precomputed', 'boxscores.csv'), index_col=0)

        # calculate min and max and add a buffer of half a standard deviation
        mins = boxscores.min()-0.5*boxscores.std()
        maxs = boxscores.max()+0.5*boxscores.std()

        bounds = {
            col: [mins[col], maxs[col]] for col in PRED_COLS
        }

        return jsonify(bounds)
    

class GetSimilarMatchups(Resource):
    """Get previous games between similar teams"""

    def get(self, 
            AST_home, 
            BLK_home,
            DREB_home,
            FG3A_home,
            FGA_home,
            FTA_home, 
            OREB_home, 
            STL_home,
            TO_home, 
            AST_away, 
            BLK_away, 
            DREB_away,
            FG3A_away,
            FGA_away,
            FTA_away,
            OREB_away, 
            STL_away, 
            TO_away
            ):
        # load precomputed boxscores
        boxscores = pd.read_csv(os.path.join(DATA_ROOT, 'precomputed', 'boxscores.csv'), index_col=0)

        # standardize original boxscores
        scaler = StandardScaler()
        boxscores[PRED_COLS] = scaler.fit_transform(boxscores[PRED_COLS].values)

        boxscore_home = np.array([
            AST_home,
            BLK_home,
            DREB_home,
            FG3A_home,
            FGA_home,
            FTA_home,
            OREB_home,
            STL_home,
            TO_home,
        ]).reshape(1, -1)

        boxscore_away = np.array([
            AST_away,
            BLK_away,
            DREB_away,
            FG3A_away,
            FGA_away,
            FTA_away,
            OREB_away,
            STL_away,
            TO_away
        ]).reshape(1, -1)

        # standardize custom boxscores
        boxscore_home = scaler.transform(boxscore_home)
        boxscore_away = scaler.transform(boxscore_away)
 
        # retrieve most similar teams
        similar_home_id = boxscores[boxscores['is_home']].iloc[closest_point(boxscore_home, boxscores[boxscores['is_home']][PRED_COLS])]['TEAM_ID']
        similar_away_id = boxscores[~boxscores['is_home']].iloc[closest_point(boxscore_away, boxscores[~boxscores['is_home']][PRED_COLS])]['TEAM_ID']

        # load games from season 2021
        games = get_season_games(2021)
        similar_games = games[(games['TEAM_ID_home']==similar_home_id) & (games['TEAM_ID_away']==similar_away_id)].copy()

        # check if there are no similar games
        if len(similar_games) == 0:
            return jsonify(similar_games.to_dict('records'))

        # do some post processing of the column names and values
        teams = pd.read_csv(os.path.join(DATA_ROOT, "dataset_teams.csv"))
        teams['name'] = teams.apply(lambda row: f"{row['CITY']} {row['NICKNAME']}", axis=1)
        id2name = {team_id: team_name for team_id, team_name in zip(teams['TEAM_ID'], teams['name'])}

        # replace team_ids with actual team names
        similar_games['Home Team'] = similar_games['TEAM_ID_home'].apply(lambda team_id: id2name.get(team_id))
        similar_games['Away Team'] = similar_games['TEAM_ID_away'].apply(lambda team_id: id2name.get(team_id))

        # format date nicely as well as which team won
        similar_games['date'] = pd.to_datetime(similar_games['GAME_DATE_EST'])
        similar_games['Game Date'] = similar_games['date'].dt.strftime('%d. %B %Y')
        similar_games['Winning Team'] = similar_games.apply(lambda row: f"Home ({row['Home Team']})" if row['HOME_TEAM_WINS'] else f"Away ({row['Away Team']})", axis=1)
        similar_games['Score'] = similar_games.apply(lambda row: f"{int(row['PTS_home'])}-{int(row['PTS_away'])}", axis=1)

        # sort games by date and select columns to be displayed
        similar_games = similar_games.sort_values('date')
        # similar_games = similar_games[['Game Date', 'Home Team', 'Away Team', 'Winning Team', 'Score']]

        return jsonify(similar_games.to_dict('records'))

class GetPossessions(Resource):

    # get number of possessions for a matchup's boxscore data
    def get(self, 
            AST_home, 
            BLK_home,
            DREB_home,
            FG3A_home,
            FGA_home,
            FTA_home, 
            OREB_home, 
            STL_home,
            TO_home, 
            AST_away, 
            BLK_away, 
            DREB_away,
            FG3A_away,
            FGA_away,
            FTA_away,
            OREB_away, 
            STL_away, 
            TO_away 
            ):
        # Note: this possession formula is from the book provided by Javi, and it's different from the formula for clustering
        possessions_home = FGA_home + 0.4 * FTA_home - OREB_home + TO_home
        possessions_away = FGA_away + 0.4 * FTA_away - OREB_away + TO_away
        possessions = {
            "home_possessions" : possessions_home,
            "away_possessions" : possessions_away
        }
        return jsonify(possessions)

