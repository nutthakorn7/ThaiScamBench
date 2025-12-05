"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { submitFeedback, type FeedbackRequest } from "@/lib/api";
import { toast } from "sonner";
import { ThumbsUp, ThumbsDown, MessageSquare } from "lucide-react";

interface FeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requestId: string;
}

export function FeedbackDialog({ open, onOpenChange, requestId }: FeedbackDialogProps) {
  const [feedbackType, setFeedbackType] = useState<"correct" | "incorrect">("correct");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!requestId) {
      toast.error("ไม่พบ Request ID");
      return;
    }

    setSubmitting(true);

    try {
      const feedbackData: FeedbackRequest = {
        request_id: requestId,
        feedback_type: feedbackType,
        comment: comment.trim() || undefined,
      };

      await submitFeedback(feedbackData);
      
      toast.success("ส่ง Feedback สำเร็จ!", {
        description: "ขอบคุณที่ช่วยเราปรับปรุงระบบ",
      });

      // Reset and close
      setComment("");
      setFeedbackType("correct");
      onOpenChange(false);
    } catch (err) {
      console.error("Feedback submission error:", err);
      toast.error("ไม่สามารถส่ง Feedback ได้", {
        description: "กรุณาลองอีกครั้งภายหลัง",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              รายงานผลการตรวจสอบ
            </DialogTitle>
            <DialogDescription>
              ช่วยเราปรับปรุงระบบโดยบอกว่าผลการตรวจสอบถูกต้องหรือไม่
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-6">
            {/* Feedback Type */}
            <div className="space-y-3">
              <Label>ผลการตรวจสอบ</Label>
              <RadioGroup
                value={feedbackType}
                onValueChange={(value: string) => setFeedbackType(value as "correct" | "incorrect")}
                className="flex flex-col gap-3"
              >
                <div className="flex items-center space-x-3 rounded-lg border p-4 hover:bg-accent cursor-pointer">
                  <RadioGroupItem value="correct" id="correct" />
                  <Label htmlFor="correct" className="flex items-center gap-2 cursor-pointer flex-1">
                    <ThumbsUp className="h-4 w-4 text-green-600" />
                    <div>
                      <div className="font-medium">ถูกต้อง</div>
                      <div className="text-sm text-muted-foreground">
                        ผลการตรวจสอบตรงกับความเป็นจริง
                      </div>
                    </div>
                  </Label>
                </div>

                <div className="flex items-center space-x-3 rounded-lg border p-4 hover:bg-accent cursor-pointer">
                  <RadioGroupItem value="incorrect" id="incorrect" />
                  <Label htmlFor="incorrect" className="flex items-center gap-2 cursor-pointer flex-1">
                    <ThumbsDown className="h-4 w-4 text-red-600" />
                    <div>
                      <div className="font-medium">ไม่ถูกต้อง</div>
                      <div className="text-sm text-muted-foreground">
                        ผลการตรวจสอบผิดพลาด
                      </div>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Comment */}
            <div className="space-y-2">
              <Label htmlFor="comment">
                ความคิดเห็นเพิ่มเติม <span className="text-muted-foreground">(ไม่บังคับ)</span>
              </Label>
              <Textarea
                id="comment"
                placeholder="เช่น ข้อความนี้เป็นข้อความปกติจากเพื่อน หรือ ระบบตรวจไม่พบลิงก์ปลอม"
                value={comment}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setComment(e.target.value)}
                maxLength={1000}
                rows={4}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground text-right">
                {comment.length}/1000
              </p>
            </div>

            {/* Request ID */}
            <div className="bg-muted/50 p-3 rounded-lg">
              <p className="text-xs text-muted-foreground">
                Request ID: <span className="font-mono font-medium">{requestId}</span>
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              ยกเลิก
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "กำลังส่ง..." : "ส่ง Feedback"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
