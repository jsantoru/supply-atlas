"""Compile manually reviewed facts; does not scrape restricted websites."""
import json
from pathlib import Path

entities, sources, claims = [], [], []
def entity(id, kind, name, description, **extra):
    entities.append(dict(id=id, kind=kind, name=name, description=description, **extra))

for id, name in [("electronics", "Consumer electronics"), ("semiconductors", "Semiconductors")]:
    entity(id, "industry", name, "Collection taxonomy; classification does not establish a supply relationship.")
for id, name in [("processors", "Application processors"), ("io", "I/O controllers"), ("power", "Power management"), ("wireless", "Wireless connectivity"), ("ethernet", "Ethernet"), ("assembly", "Board assembly"), ("microcontrollers", "Microcontrollers")]:
    entity(id, "category", name, "Component category, distinct from a specific part.", industry_id="semiconductors" if id != "assembly" else "electronics")
entity("wales", "region", "Wales, United Kingdom", "Geographic region. Only documented facility relationships establish exposure.")
entity("silicon", "material", "Silicon", "Upstream material coverage is not yet established. No refinery, wafer or material supplier is claimed.", industry_id="semiconductors")
for id, name, aliases in [("raspberry-pi", "Raspberry Pi", ["Raspberry Pi Ltd", "Raspberry Pi Trading"]), ("broadcom", "Broadcom", ["Broadcom Inc."]), ("renesas", "Renesas", ["Renesas Electronics"]), ("infineon", "Infineon", ["Infineon Technologies"]), ("tsmc", "TSMC", ["Taiwan Semiconductor Manufacturing Company"]), ("sony", "Sony", ["Sony UK TEC"]), ("via", "VIA Labs", ["VLI"])]:
    entity(id, "company", name, "See individual claims for documented roles, products, periods and manufacturing locations.", aliases=aliases, industry_id="electronics" if id in ("raspberry-pi", "sony") else "semiconductors")
entity("pencoed", "facility", "Sony UK Technology Centre", "Pencoed, South Wales. Documented board assembly; this is not evidence of semiconductor fabrication here.", region_id="wales", latitude=51.523, longitude=-3.5, precision="approximate", location_reference="Town-level placement for Pencoed, South Wales, identified in the Pi 5 launch article; not a surveyed factory coordinate.", industry_id="electronics")
for id, name, desc in [("pi5", "Raspberry Pi 5", "Flagship single-board computer · 2023 launch collection"), ("pi4", "Raspberry Pi 4 Model B", "Single-board computer · partial chipset collection"), ("pi500", "Raspberry Pi 500", "Keyboard computer · shared BCM2712 and RP1 dependencies"), ("pi400", "Raspberry Pi 400", "Keyboard computer · shared BCM2711 dependency"), ("pico", "Raspberry Pi Pico", "Microcontroller board · RP2040 and upstream fabrication")]:
    entity(id, "product", name, desc + ". A documented partial breakdown, not a complete bill of materials.", industry_id="electronics", aliases=[name.replace("Raspberry Pi", "Pi")])
for ram in (4, 8):
    entity(f"pi5-{ram}gb", "variant", f"Raspberry Pi 5 · {ram} GB", "Launch memory variant. Claims without variant scope do not establish variant-specific sourcing.", parent_id="pi5", industry_id="electronics")
for id, name, category, desc in [("bcm2712", "BCM2712", "processors", "Broadcom application processor"), ("bcm2711", "BCM2711", "processors", "Broadcom application processor"), ("rp1", "RP1", "io", "Raspberry Pi I/O controller"), ("da9091", "DA9091", "power", "Renesas power-management IC"), ("cyw43455", "CYW43455", "wireless", "Infineon Wi-Fi and Bluetooth device"), ("bcm54213", "BCM54213", "ethernet", "Broadcom Gigabit Ethernet PHY"), ("vl805", "VL805", "io", "VIA Labs USB controller"), ("rp2040", "RP2040", "microcontrollers", "Raspberry Pi microcontroller"), ("pi5-board", "Pi 5 board assembly", "assembly", "Product-specific assembled board; not an upstream chip fabrication stage")]:
    entity(id, "part", name, desc + ". Inspect claims for evidence and sourcing scope.", category_id=category, industry_id="electronics" if category == "assembly" else "semiconductors")

def source(id, title, url, published=None, licensed=False):
    sources.append(dict(id=id,title=title,url=url,publisher="Raspberry Pi Ltd",published=published,retrieved="2026-09-10",license="CC BY-SA 4.0" if licensed else "Publicly viewable; all rights reserved",terms_url="https://www.raspberrypi.com/licensing/" if licensed else "https://www.raspberrypi.com/terms-and-conditions/",reuse="Adapted factual identification with attribution. Documentation-derived data is CC BY-SA 4.0; changes: normalized into entity and claim records." if licensed else "Manual factual reference only. No article text, images or full-page copy redistributed. Automated scraping disabled under source terms.",adapter="raspberrypi-docs" if licensed else "manual-reference"))
source("pi5-launch", "Introducing: Raspberry Pi 5!", "https://www.raspberrypi.com/news/introducing-raspberry-pi-5/", "2023-09-28")
source("rp1-design", "RP1: the silicon controlling Raspberry Pi 5 I/O", "https://www.raspberrypi.com/news/rp1-the-silicon-controlling-raspberry-pi-5-i-o-designed-here-at-raspberry-pi/", "2023-10-06")
source("bcm2711-doc", "BCM2711 processor documentation", "https://github.com/raspberrypi/documentation/blob/master/documentation/asciidoc/computers/processors/bcm2711.adoc", licensed=True)
source("keyboard-doc", "Keyboard computer processor documentation", "https://github.com/raspberrypi/documentation/blob/master/documentation/asciidoc/computers/keyboard-computers/intro.adoc", licensed=True)
source("pi500-spec", "Raspberry Pi 500 product specifications", "https://www.raspberrypi.com/products/raspberry-pi-500/")
source("pico-launch", "Meet Raspberry Silicon: Raspberry Pi Pico", "https://www.raspberrypi.com/news/raspberry-pi-silicon-pico-now-on-sale/", "2021-01-21")
source("rp2040-process", "Raspberry Pi Direct: RP2040", "https://www.raspberrypi.com/news/raspberry-pi-direct-buy-rp2040-in-bulk-from-just-0-70/", "2022-01-17")

def claim(id, supplier, part, product, role, source_id, reference, observed, **extra):
    record=dict(id=id,supplier_id=supplier,customer_id="raspberry-pi",part_id=part,product_id=product,role=role,status="direct",observed_at=observed,period="Documented at source date; end date and present-day continuity unconfirmed.",uncertainty="Specific manufacturing facility, batch allocation and alternate suppliers are not established. This record does not establish sole sourcing.",evidence=[dict(source_id=source_id,reference=reference)])
    record.update(extra)
    claims.append(record)
for part, supplier, role, ref in [("bcm2712","broadcom","designer","New platform, new chipset / BCM2712"),("rp1","raspberry-pi","designer","New platform, new chipset / RP1"),("da9091","renesas","component supplier","New platform, new chipset / DA9091"),("cyw43455","infineon","component supplier","Paragraph following DA9091: retained wireless chipset"),("bcm54213","broadcom","component supplier","Paragraph following DA9091: Ethernet PHY")]:
    claim("pi5-"+part,supplier,part,"pi5",role,"pi5-launch",ref,"2023-09-28")
claim("pi5-assembly","sony","pi5-board","pi5","assembler","pi5-launch","Designed in Cambridge, manufactured in Wales","2023-09-28",facility_id="pencoed",region_id="wales",uncertainty="Board assembly in Pencoed is supported for the 2023 launch. Chip fabrication at this facility, all later batches and exclusivity are not established.")
claim("rp1-fabrication","tsmc","rp1",None,"fabricator","rp1-design","Opening technical description: TSMC 40LP implementation","2023-10-06",uncertainty="TSMC process is identified for RP1. Specific fab and country of fabrication are undisclosed. Applying this part-level sourcing to later products is an inference, not a product-specific sourcing confirmation.")
for part,supplier,ref in [("cyw43455","infineon","New platform, new chipset: wireless device retained from Pi 4"),("bcm54213","broadcom","New platform, new chipset: Ethernet PHY retained"),("vl805","via","RP1 section: Pi 4 external USB controller")]:
    claim("pi4-"+part,supplier,part,"pi4","component supplier","pi5-launch",ref,"2023-09-28")
for product in ("pi4","pi400"):
    claim(product+"-bcm2711","broadcom","bcm2711",product,"designer","bcm2711-doc","Opening paragraph: BCM2711 product list","2026-09-10",period="Documentation retrieved September 2026; publication and batch dates not supplied.")
for part,supplier in [("bcm2712","broadcom"),("rp1","raspberry-pi")]:
    claim("pi500-"+part,supplier,part,"pi500","designer","keyboard-doc","Introduction: processor and I/O controller identification","2026-09-10",period="Documentation retrieved September 2026; production allocation not supplied.")
claim("pico-rp2040","raspberry-pi","rp2040","pico","designer","pico-launch","Opening product announcement and RP2040 description","2021-01-21")
claim("rp2040-fabrication","tsmc","rp2040",None,"fabricator","rp2040-process","TSMC 40LP process discussion","2022-01-17",uncertainty="Part-level fabrication process evidence. Fab location, packaging provider and product/batch allocation remain unknown.")

if __name__ == "__main__":
    Path(__file__).with_name("collection.json").write_text(json.dumps(dict(entities=entities,sources=sources,claims=claims),indent=2)+"\n",encoding="utf-8")
