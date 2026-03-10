#python3 - <<'PY'
import csv, subprocess

csv_path = "splash-issues.csv"

with open(csv_path, newline="", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    for row in reader:
        title = row["Title"].strip()
        body = row["Body"].replace("\\n", "\n").strip()
        labels = [x.strip() for x in row["Labels"].split(",") if x.strip()]
        milestone = row["Milestone"].strip()

        cmd = ["gh", "issue", "create", "--title", title, "--body", body]
        if labels:
            cmd += ["--label", ",".join(labels)]
        if milestone:
            cmd += ["--milestone", milestone]

        subprocess.run(cmd, check=True)
        print(f"Created: {title}")
