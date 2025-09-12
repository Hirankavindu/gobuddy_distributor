// A simple placeholder component for pages not yet implemented
export default function PlaceholderPage({ title }) {
  return (
    <div className="p-8 text-center">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{title} Page</h2>
      <p className="text-gray-600 dark:text-gray-300">This page is under construction.</p>
    </div>
  );
}