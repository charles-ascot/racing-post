from lxml.html import HtmlElement


class Pedigree:
    def __init__(self, info: list[HtmlElement]):
        self.pedigrees: list[HtmlElement] = info[::4]
        self.sires: list[str] = [x.text_content().strip() for x in info[1::4]]
        self.dams: list[str] = [x.text_content().strip() for x in info[2::4]]
        self.damsires: list[str] = [x.text_content().strip() for x in info[3::4]]

        self.id_sires: list[str] = [x.find('a').attrib['href'].split('/')[3] for x in info[1::4]]
        self.id_dams: list[str] = [x.find('a').attrib['href'].split('/')[3] for x in info[2::4]]
        self.id_damsires: list[str] = [x.find('a').attrib['href'].split('/')[3] for x in info[3::4]]
