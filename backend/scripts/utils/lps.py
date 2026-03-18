def get_lps_scale(race_type: str, going: str) -> float:
    # Lengths per second scale based on race type and going
    # This is a simplified version, real scales vary by course and distance
    
    scales = {
        'Flat': {
            'Firm': 6.0,
            'Good To Firm': 6.0,
            'Good': 6.0,
            'Good To Soft': 5.5,
            'Soft': 5.0,
            'Heavy': 4.5,
            'Standard': 6.0,
            'Slow': 5.5,
            'Fast': 6.5,
        },
        'Hurdle': {
            'Firm': 5.5,
            'Good To Firm': 5.5,
            'Good': 5.0,
            'Good To Soft': 4.5,
            'Soft': 4.0,
            'Heavy': 3.5,
        },
        'Chase': {
            'Firm': 5.5,
            'Good To Firm': 5.5,
            'Good': 5.0,
            'Good To Soft': 4.5,
            'Soft': 4.0,
            'Heavy': 3.5,
        },
        'NH Flat': {
            'Good': 5.0,
            'Good To Soft': 4.5,
            'Soft': 4.0,
            'Heavy': 3.5,
        }
    }
    
    type_scales = scales.get(race_type, scales['Flat'])
    return type_scales.get(going, 5.0)
