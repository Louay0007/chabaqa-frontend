export default function AutoDmLoading() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-8 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gray-200" />
          <div className="space-y-2">
            <div className="w-28 h-5 rounded bg-gray-200" />
            <div className="w-64 h-4 rounded bg-gray-100" />
          </div>
        </div>
        <div className="w-32 h-9 rounded-lg bg-gray-200" />
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-6 flex justify-between items-center">
        <div className="space-y-2 flex-1">
          <div className="w-40 h-5 rounded bg-gray-200" />
          <div className="w-72 h-4 rounded bg-gray-100" />
        </div>
        <div className="w-10 h-10 rounded-full bg-gray-200 ml-6" />
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
        <div className="w-36 h-5 rounded bg-gray-200" />
        <div className="flex gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="w-32 h-7 rounded-full bg-gray-100" />
          ))}
        </div>
        <div className="w-full h-48 rounded-xl bg-gray-100" />
      </div>
    </div>
  )
}
