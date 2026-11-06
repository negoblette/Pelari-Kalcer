import { TICKER_ITEMS } from "./data";

function Row({ hidden }) {
  return (
    <ul aria-hidden={hidden} className="flex shrink-0">
      {TICKER_ITEMS.map((item) => (
        <li key={item} className="flex items-center">
          <span className="px-6">{item}</span>
          <span aria-hidden className="size-2 rounded-full bg-aspal" />
        </li>
      ))}
    </ul>
  );
}

export default function Ticker() {
  return (
    <div className="overflow-hidden bg-oranye py-3 font-mono text-sm font-medium uppercase text-aspal">
      <div className="ticker flex w-max">
        <Row />
        <Row hidden />
      </div>
    </div>
  );
}
