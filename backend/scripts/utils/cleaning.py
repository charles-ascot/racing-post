from re import sub


def clean_race(race: str) -> str:
    race = sub(r'\(Class \d\)', '', race)
    race = sub(r'\(Grade \d\)', '', race)
    race = sub(r'\(Group \d\)', '', race)
    race = sub(r'\(Listed Race\)', '', race)
    race = sub(r'\(Premier Handicap\)', '', race)
    return race.strip()


def clean_string(string: str) -> str:
    return string.strip().replace(',', '').replace('\n', '').replace('\r', '').replace('\t', '')


def strip_row(row: list[str]) -> list[str]:
    return [x.strip() for x in row]
