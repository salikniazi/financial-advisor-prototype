import FilingForm from "@/components/tax/FilingForm";

export default function TaxFileReturnPage() {
  return (
    <div className="pb-16">
      <p className="mb-4 text-sm text-muted max-w-2xl">
        This mirrors FBR&apos;s Wealth Statement structure. Lines marked with a green check were auto-filled from your Lime
        data; lines marked with a warning need your input.
      </p>
      <FilingForm />
    </div>
  );
}
