"""
Evaluation script for ThaiScamBench
Run: python scripts/evaluate.py
"""
import json
from pathlib import Path
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score
import requests
import time
from typing import List, Dict

def load_dataset(path: str) -> List[Dict]:
    """โหลด JSONL dataset"""
    examples = []
    with open(path, encoding="utf-8") as f:
        for line in f:
            if line.strip():
                examples.append(json.loads(line))
    return examples

def evaluate_model(api_url: str, test_file: str, output_file: str = "evaluation_results.json"):
    """ประเมิน model ผ่าน API"""
    
    print(f"Loading test data from {test_file}...")
    test_data = load_dataset(test_file)
    print(f"Loaded {len(test_data)} test examples\n")
    
    y_true = []
    y_pred = []
    errors = []
    response_times = []
    
    print("Evaluating model...")
    for i, ex in enumerate(test_data, 1):
        try:
            start_time = time.time()
            
            # เรียก API
            response = requests.post(
                f"{api_url}/v1/public/detect/text",
                json={"message": ex["text"], "channel": ex["metadata"].get("channel", "SMS")},
                timeout=10
            )
            
            response_time = time.time() - start_time
            response_times.append(response_time)
            
            if response.ok:
                result = response.json()
                y_true.append(ex["label"])
                y_pred.append(result["category"])
                
                # Log incorrect predictions
                if result["category"] != ex["label"]:
                    errors.append({
                        "id": ex["id"],
                        "text": ex["text"],
                        "true_label": ex["label"],
                        "pred_label": result["category"],
                        "risk_score": result["risk_score"]
                    })
            else:
                print(f"  ❌ API error for {ex['id']}: {response.status_code}")
                errors.append({"id": ex["id"], "error": f"HTTP {response.status_code}"})
        
        except Exception as e:
            print(f"  ❌ Error processing {ex['id']}: {str(e)}")
            errors.append({"id": ex["id"], "error": str(e)})
        
        # Progress
        if i % 10 == 0 or i == len(test_data):
            print(f"  Progress: {i}/{len(test_data)}")
    
    # คำนวณ metrics
    print("\n" + "="*70)
    print("EVALUATION RESULTS")
    print("="*70 + "\n")
    
    if len(y_true) > 0:
        # Accuracy
        acc = accuracy_score(y_true, y_pred)
        print(f"Overall Accuracy: {acc:.2%}\n")
        
        # Classification report
        print("Classification Report:")
        print(classification_report(y_true, y_pred, zero_division=0))
        
        # Confusion matrix
        print("\nConfusion Matrix:")
        cm = confusion_matrix(y_true, y_pred)
        labels = sorted(set(y_true + y_pred))
        print(f"\nLabels: {labels}")
        print(cm)
        
        # Performance stats
        avg_time = sum(response_times) / len(response_times) if response_times else 0
        print(f"\nPerformance:")
        print(f"  Avg response time: {avg_time*1000:.1f}ms")
        print(f"  Min response time: {min(response_times)*1000:.1f}ms")
        print(f"  Max response time: {max(response_times)*1000:.1f}ms")
        
        # Save results
        results = {
            "accuracy": float(acc),
            "num_examples": len(y_true),
            "num_errors": len(errors),
            "report": classification_report(y_true, y_pred, output_dict=True, zero_division=0),
            "confusion_matrix": cm.tolist(),
            "labels": labels,
            "avg_response_time_ms": avg_time * 1000,
            "errors": errors[:10]  # Save first 10 errors
        }
        
        with open(output_file, "w", encoding="utf-8") as f:
            json.dump(results, f, indent=2, ensure_ascii=False)
        
        print(f"\n✅ Results saved to {output_file}")
        
        # Show sample errors
        if errors:
            print(f"\nSample Errors ({len(errors)} total):")
            for err in errors[:5]:
                if "true_label" in err:
                    print(f"  {err['id']}: {err['true_label']} → {err['pred_label']}")
                else:
                    print(f"  {err['id']}: {err.get('error', 'Unknown error')}")
    else:
        print("❌ No successful predictions to evaluate")
        results = {"error": "No successful predictions", "num_errors": len(errors)}
        with open(output_file, "w") as f:
            json.dump(results, f, indent=2)
    
    return results

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Evaluate ThaiScamBench model")
    parser.add_argument("--api-url", default="http://localhost:8000", help="API base URL")
    parser.add_argument("--test-file", default="datasets/test.jsonl", help="Test dataset file")
    parser.add_argument("--output", default="evaluation_results.json", help="Output file")
    
    args = parser.parse_args()
    
    evaluate_model(args.api_url, args.test_file, args.output)
