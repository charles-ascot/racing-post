from orjson import loads
import os

def _load_regions():
    project_root = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
    path = os.path.join(project_root, 'courses/_regions')
    with open(path, 'r') as f:
        return loads(f.read())

_regions = _load_regions()


def get_region(course_id: str) -> str:
    project_root = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
    path = os.path.join(project_root, 'courses/_courses')
    with open(path, 'r') as f:
        courses = loads(f.read())
    
    courses.pop('all')

    for region, course in courses.items():
        for _id in course.keys():
            if _id == course_id:
                return region.upper()

    return ''


def print_region(code: str, region: str):
    print(f'\tCODE: {code: <4} |  {region}')


def print_regions():
    for code, region in _regions.items():
        print_region(code, region)


def region_search(term: str):
    for code, region in _regions.items():
        if term.lower() in region.lower():
            print_region(code, region)


def valid_region(code: str) -> bool:
    return code in _regions
