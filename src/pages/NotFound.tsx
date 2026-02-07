import { motion } from "framer-motion";
import { useTranslation } from "@/hooks/use-translation";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  const { t } = useTranslation();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen flex flex-col"
    >

      
      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="max-w-5xl mx-auto relative px-4">
          <div className="flex items-center justify-center min-h-[200px]">
            <div className="text-center space-y-6">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">{t("notFound.title")}</h1>
              <p className="text-lg text-gray-600">{t("notFound.desc")}</p>
              <Link to="/">
                <Button>{t("notFound.home")}</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}