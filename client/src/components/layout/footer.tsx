export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-white">
      <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 md:flex md:items-center md:justify-between lg:px-8">
        <div className="mt-8 md:mt-0 md:order-1">
          <p className="text-center text-base text-gray-400">
            &copy; {currentYear} Betelistii Prayer Tracker. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
