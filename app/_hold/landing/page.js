import FinalBib from "./FinalBib";
import FitCheck from "./FitCheck";
import Hero from "./Hero";
import PaceLab from "./PaceLab";
import Routes from "./Routes";
import { RunnerProvider } from "./RunnerContext";
import Ticker from "./Ticker";

export default function Home() {
  return (
    <RunnerProvider>
      <main>
        <Hero />
        <Ticker />
        <FitCheck />
        <PaceLab />
        <Routes />
        <FinalBib />
      </main>
    </RunnerProvider>
  );
}
