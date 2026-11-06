import { GearPage } from "../_components/Pages";
import RegisterServiceWorker from "../_components/RegisterServiceWorker";

export const metadata = {
  title: "Gear | Pelari Kalcer",
  description: "Sepatu dan mileage kamu.",
};

export default function Gear() {
  return (
    <>
      <GearPage />
      <RegisterServiceWorker />
    </>
  );
}
