export default function Code({ children }: { children: React.ReactNode }) {
	return (
		<code className="px-2 py-1 m-1 bg-slate-700 font-mono rounded-md text-slate-200">
			{children}
		</code>
	);
}