import numpy as np
from flask import jsonify
from flask_restful import Resource

from .utils import load_new_stat_classifier


class GetPredictionBoxscore(Resource):

    def get(
            self, 
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
        """Get the predicted winning odds of the home team based on the boxscore stats"""

        X_inference = np.array([
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
        ]).reshape(1, -1)
        
        model = load_new_stat_classifier()
    
        predicted_proba = model.predict(X_inference)[0]

        return jsonify({'winning_odds_home': predicted_proba})
