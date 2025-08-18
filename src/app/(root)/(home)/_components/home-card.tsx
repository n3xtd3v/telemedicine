import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type HomeCardProps = {
  title: string;
  des: string;
  icon: React.ReactNode;
  handleClick: () => void;
};

export default function HomeCard({
  title,
  des,
  icon,
  handleClick,
}: HomeCardProps) {
  return (
    <Card className="w-full cursor-pointer" onClick={handleClick}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{des}</CardDescription>
      </CardHeader>
      <CardContent className="flex justify-center">{icon}</CardContent>
    </Card>
  );
}
