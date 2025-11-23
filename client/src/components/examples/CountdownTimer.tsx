import CountdownTimer from "../CountdownTimer";

export default function CountdownTimerExample() {
  const futureDate = new Date(Date.now() + 2 * 60 * 60 * 1000 + 30 * 60 * 1000);
  
  return (
    <div className="flex flex-col gap-8 items-center justify-center">
      <CountdownTimer endDate={futureDate} size="lg" />
      <CountdownTimer endDate={futureDate} size="md" />
      <CountdownTimer endDate={futureDate} size="sm" />
    </div>
  );
}
