import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type MeetingModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  buttonLabel?: string;
  handleClick?: () => void | Promise<void>;
  className?: string;
  description?: string;
  children?: React.ReactNode;
};

export default function MeetingModal({
  isOpen,
  onClose,
  title,
  buttonLabel,
  handleClick,
  description,
  children,
}: MeetingModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div>{children}</div>
        <DialogFooter>
          <Button type="button" onClick={handleClick} className="w-full">
            {buttonLabel || "Schedule Meeting"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
