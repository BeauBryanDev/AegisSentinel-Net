from pathlib import Path
from collections import Counter

dataset_path = Path("./UrbanGreen")  

for stage in ["train", "val"]:
    labels = list((dataset_path / stage / "labels").glob("*.txt"))
    class_counter = Counter()
    for lf in labels:
        for line in open(lf):
            if line.strip():
                class_counter[int(line.split()[0])] += 1
    
    print(f"\n{stage.upper()} — {len(labels)} imágenes")
    for cid, name in enumerate(["Building","Road","Water","Land","Forest","Farmland"]):
        print(f"  {cid} {name:12s}: {class_counter.get(cid,0):>8,}")
