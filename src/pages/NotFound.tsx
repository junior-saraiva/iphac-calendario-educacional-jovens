import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import HelpPanel from '@/components/HelpPanel';

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <p className="text-xl text-gray-600 mb-4">Oops! Page not found</p>
        <a href="/" className="text-blue-500 hover:text-blue-700 underline">
          Return to Home
        </a>
        <div className="mt-6">
          <HelpPanel pageKey="404">
            <ul className="list-disc pl-5 space-y-1 text-left">
              <li>A rota acessada não existe ou foi movida.</li>
              <li>Use o link acima para voltar à página inicial.</li>
            </ul>
          </HelpPanel>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
