import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function EventOfficeDocuments() {
  const [docs, setDocs] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const res = await axios.get("http://localhost:4000/api/documents");
        setDocs(res.data.data || []);
      } catch (err) {
        console.error("Failed to load documents", err);
      }
    };
    fetchDocs();
  }, []);

  const isImage = (fileName) => {
    const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".svg", ".webp"];
    return imageExtensions.some(ext => fileName.toLowerCase().endsWith(ext));
  };

  return (
    <div className="p-8 bg-gradient-to-br from-yellow-50 to-orange-100 min-h-screen">
      {/* Back Button */}
      <button
        onClick={() => navigate("/home")}
        className="mb-6 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg shadow"
      >
        ⬅ Back
      </button>

      <h2 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        📂 All Uploaded Documents
      </h2>

      {docs.length === 0 ? (
        <p className="text-gray-500">No uploaded files found</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {docs.map((doc, i) => (
            <div key={i} className="bg-white p-4 rounded-xl border shadow hover:shadow-lg transition-all">
              <h4 className="font-semibold text-gray-700 text-sm truncate mb-3">
                {doc.file}
              </h4>

              {/* Preview if Image */}
              {isImage(doc.file) ? (
                <a href={`http://localhost:4000/uploads/${doc.file}`} target="_blank" rel="noopener noreferrer">
                  <img
                    src={`http://localhost:4000/uploads/${doc.file}`}
                    alt={doc.file}
                    className="w-full h-40 object-cover rounded-lg mb-3 cursor-pointer hover:opacity-90"
                  />
                </a>
              ) : (
                <div className="flex justify-center items-center bg-gray-100 h-40 rounded-lg text-gray-500 text-sm">
                  📄 File Preview Not Available
                </div>
              )}

              {/* Download button */}
            <a
  href={`http://localhost:4000/api/documents/download/${doc.file}`}
  className="block w-full text-center bg-orange-600 hover:bg-orange-700 text-white py-2 rounded-lg"
>
  ⬇ Download
</a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
