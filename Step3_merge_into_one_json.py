import argparse
import glob
import json
import os


def merge_json(args):
    sub_folder_name_list = os.listdir(args.judge_files_folder)
    dataset_name_list = [
        sub.replace("_chatgpt_eval", "").replace("_rule_eval", "")
        for sub in sub_folder_name_list
    ]
    datasets_dict = {}
    for i, dataset_name in enumerate(dataset_name_list):
        single_dataset_dict = {}
        jsonfiles = glob.glob(os.path.join(args.judge_files_folder, sub_folder_name_list[i], "*.json"))
        for jsonfile in jsonfiles:
            with open(jsonfile, "r", encoding="utf-8") as f:
                data = json.load(f)
                single_dataset_dict.update(data)
        datasets_dict[dataset_name] = single_dataset_dict

    with open(args.merge_file, "w", encoding="utf-8") as f:
        json.dump(datasets_dict, f, indent=2, ensure_ascii=False)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--judge_files_folder", type=str, default="./Rule_Judge")
    parser.add_argument("--merge_file", type=str, default="./ChronoPhyBench_Input.json")
    args = parser.parse_args()
    merge_json(args)
