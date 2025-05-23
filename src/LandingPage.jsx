import React, { useState, useEffect } from "react";
import {
  Upload,
  Leaf,
  AlertCircle,
  RefreshCw,
  Loader2,
  Download,
  ChevronsUp,
} from "lucide-react";
import { getLeafProperties } from "./constants/leafProperties";
import { LEAF_SCIENTIFIC_NAMES } from "./constants/leafProperties";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Features from "./Features";

export default function LandingPage() {
  const [image, setImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [animateBackground, setAnimateBackground] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [formattedConfidence, setFormattedConfidence] = useState("");
  const [leafProperties, setLeafProperties] = useState([]);

  useEffect(() => {
    setAnimateBackground(true);

    if (results && !showResults) {
      setTimeout(() => setShowResults(true), 300);
    }

    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [results]);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files[0]) processFile(e.dataTransfer.files[0]);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) processFile(file);
  };

  const processFile = (file) => {
    setImage(file);
    setPreviewUrl(URL.createObjectURL(file));
    setShowResults(false);
    analyzeImage(file);
  };

  const clearImage = () => {
    setImage(null);
    setPreviewUrl(null);
    setResults(null);
    setIsAnalyzing(false);
    setShowResults(false);
  };

  const analyzeImage = async (file) => {
    setIsAnalyzing(true);

    try {
      let formData = new FormData();
      formData.append("file", file);

      const response = await fetch("http://localhost:8001/predict", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Failed to analyze image");

      const data = await response.json();
      console.log("Whole result:", data);

      // Calculate values before setting state
      const formatted = (data.confidence * 100).toFixed(2);
      const properties = getLeafProperties(data.class) || [];

      console.log("Properties:", properties); // Debugging

      // Set all state values together
      setResults(data);
      setFormattedConfidence(formatted);
      setLeafProperties(properties);
    } catch (error) {
      setResults({ error: "Failed to analyze image. Please try again." });
      setFormattedConfidence("");
      setLeafProperties([]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDownloadReport = async () => {
    const doc = new jsPDF("p", "mm", "a4");

    // Header with Blue Gradient Style (Manual)
    doc.setFillColor("#007BFF");
    doc.rect(0, 0, 210, 25, "F"); // Blue background for the header

    // Title Text
    doc.setFontSize(20);
    doc.setTextColor("#FFFFFF");
    doc.text("Leaf Classification Report", 105, 15, null, null, "center");

    let y = 40; // Start below the header
    doc.setFontSize(12);
    doc.setTextColor("#34495e");

    // Add Uploaded Image (Auto-scaling)
    if (image) {
      const base64Image = await convertImageToBase64(image);
      const imgWidth = 60;
      const imgHeight = 60;
      doc.addImage(base64Image, "JPEG", 75, y, imgWidth, imgHeight);
      y += 70;
    }

    // Leaf Class
    doc.setFontSize(14);
    doc.setTextColor("#007BFF");
    doc.text("Leaf Class:", 10, y);
    doc.setTextColor("#2c3e50");
    doc.text(results.class || "N/A", 50, y);
    y += 10;

    // Scientific Name
    doc.setTextColor("#007BFF");
    doc.text("Scientific Name:", 10, y);
    doc.setTextColor("#2c3e50");
    doc.text(LEAF_SCIENTIFIC_NAMES[results.class] || "N/A", 50, y);
    y += 10;

    // Confidence
    doc.setTextColor("#007BFF");
    doc.text("Confidence:", 10, y);
    doc.setTextColor("#2c3e50");
    doc.text(formattedConfidence || "N/A", 50, y);
    y += 10;

    // Medicinal Properties
    doc.setTextColor("#007BFF");
    doc.text("Medicinal Properties:", 10, y);
    y += 8;
    doc.setTextColor("#2c3e50");

    // Display properties in a numbered list
    leafProperties.forEach((prop, index) => {
      doc.text(`${index + 1}. ${prop}`, 15, y);
      y += 8;
    });

    // Footer Line
    doc.setDrawColor("#007BFF");
    doc.line(10, y + 5, 200, y + 5);

    // Footer Text
    y += 15;
    doc.setTextColor("#007BFF");
    doc.setFontSize(10);
    doc.text("Generated by LeafMD", 105, y, null, null, "center");

    // Save PDF
    doc.save("leaf_report.pdf");
  };

  // Utility to Convert Image to Base64
  const convertImageToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  };

  return (
    <div
      className={`flex flex-col min-h-screen bg-gray-950 text-gray-100 relative overflow-hidden transition-all duration-500 ${
        animateBackground ? "animate-background" : ""
      }`}
    >
      {/* Animated background elements */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600 rounded-full mix-blend-multiply filter blur-5xl opacity-5 animate-blob"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-green-600 rounded-full mix-blend-multiply filter blur-5xl opacity-5 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-5xl opacity-5 animate-blob animation-delay-4000"></div>
      </div>

      {/* Gradient top border */}
      <div className="h-1 w-full bg-gradient-to-r from-green-400 via-blue-500 to-purple-600"></div>

      <Navbar />

      {/* Main Content */}
      <main className="flex-grow relative z-10">
        <div className="max-w-6xl mx-auto p-6">
          {/* Hero Section */}
          <div className="text-center my-8 md:my-12 animate-fadeIn">
            <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-green-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">
              Medical Leaf Detection
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Identify medicinal plants with our advanced machine learning
              model. Simply upload a clear image of a leaf for instant analysis.
            </p>
          </div>

          {/* Upload Section */}
          <div className="bg-gray-900 bg-opacity-70 backdrop-blur-lg rounded-xl p-6 md:p-8 shadow-2xl mb-12 border border-gray-800 relative animate-slideUp">
            {/* Glowing accents */}
            <div className="absolute top-0 left-0 w-24 h-24 bg-green-500 rounded-full filter blur-3xl opacity-5"></div>
            <div className="absolute bottom-0 right-0 w-24 h-24 bg-blue-500 rounded-full filter blur-3xl opacity-5"></div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Upload Area */}
              <div className="flex flex-col items-center justify-center">
                <div
                  className={`w-full aspect-square max-w-md border-2 ${
                    dragActive
                      ? "border-green-400 scale-102"
                      : previewUrl
                      ? "border-blue-500"
                      : "border-gray-700"
                  } border-dashed rounded-lg flex flex-col items-center justify-center overflow-hidden relative transition-all duration-300 group hover:border-green-400`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  {/* Background glow effect */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-br from-green-900 to-blue-900 opacity-0 group-hover:opacity-20 transition-opacity duration-300 ${
                      dragActive ? "opacity-20" : ""
                    }`}
                  ></div>

                  {previewUrl ? (
                    <div className="relative w-full h-full">
                      <img
                        src={previewUrl}
                        alt="Leaf preview"
                        className="w-full h-full object-contain p-4"
                      />
                      <div className="absolute inset-0 bg-gray-900 bg-opacity-20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300">
                        <div className="bg-gray-900 bg-opacity-70 rounded-lg p-2">
                          <p className="text-sm text-gray-300">
                            Click to replace image
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center p-8 z-10 group-hover:scale-110 transition-transform duration-300">
                      <div className="relative">
                        <Upload className="h-16 w-16 mx-auto text-gray-500 mb-4 group-hover:text-green-400 transition-colors duration-300" />
                        <div className="absolute inset-0 bg-green-500 rounded-full filter blur-md opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                      </div>
                      <p className="text-gray-400 group-hover:text-gray-300 transition-colors duration-300">
                        Drag and drop a leaf image or click to browse
                      </p>
                    </div>
                  )}

                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer z-20"
                  />
                </div>

                <div className="mt-6 flex flex-col sm:flex-row gap-4 items-center">
                  <button className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white font-medium py-2 px-6 rounded-lg cursor-pointer transition-all duration-300 flex items-center justify-center group relative overflow-hidden shadow-lg">
                    <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-green-400 to-blue-500 opacity-0 group-hover:opacity-30 transition-opacity duration-300"></span>
                    <Upload className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform duration-300" />
                    <span className="relative z-10">Upload Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer z-20"
                    />
                  </button>

                  <button
                    onClick={clearImage}
                    disabled={!image}
                    className={`flex items-center justify-center py-2 px-6 rounded-lg font-medium transition-all duration-300 ${
                      image
                        ? "bg-gray-800 hover:bg-gray-700 text-white shadow-lg"
                        : "bg-gray-800 text-gray-600 cursor-not-allowed opacity-50"
                    }`}
                  >
                    <RefreshCw
                      className={`h-5 w-5 mr-2 ${
                        isAnalyzing ? "animate-spin" : ""
                      }`}
                    />
                    Clear
                  </button>
                </div>
              </div>

              {/* Results Area */}
              <div className="bg-gray-900 bg-opacity-60 backdrop-blur-sm rounded-lg p-6 border border-gray-800 flex flex-col justify-center relative group overflow-hidden">
                {/* Background glow effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-900 to-purple-900 opacity-0 group-hover:opacity-10 transition-opacity duration-500"></div>

                <h3 className="text-2xl font-semibold mb-6 text-center bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
                  Analysis Results
                </h3>

                {isAnalyzing ? (
                  <div className="flex flex-col items-center justify-center h-48 animate-pulse">
                    <div className="relative">
                      <Loader2 className="animate-spin h-12 w-12 text-blue-500" />
                      <div className="absolute inset-0 bg-blue-500 rounded-full filter blur-md opacity-20"></div>
                    </div>
                    <p className="text-gray-400 mt-4">
                      Analyzing leaf image...
                    </p>
                    <div className="w-full max-w-xs bg-gray-800 rounded-full h-1 mt-4 overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-green-400 to-blue-500 animate-progressBar"></div>
                    </div>
                  </div>
                ) : results ? (
                  <div
                    className={`space-y-6 transition-all duration-500 ${
                      showResults
                        ? "opacity-100 translate-y-0"
                        : "opacity-0 translate-y-4"
                    }`}
                  >
                    {/* If confidence is less than 50%, display this message */}
                    {formattedConfidence < 50 ? (
                      <div className="bg-gray-800 bg-opacity-50 backdrop-blur-sm p-4 rounded-lg border border-gray-700">
                        <p className="text-orange-500 text-2xl font-semibold">
                          Probably not a medicinal leaf
                        </p>
                        <p className="text-sm text-gray-400 mt-2">
                          Try uploading a clearer image for better results.
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="bg-gray-800 bg-opacity-50 backdrop-blur-sm p-4 rounded-lg border border-gray-700 hover:border-blue-500 transition-colors duration-300 group/item">
                          <p className="text-gray-400 mb-1 text-sm">
                            Leaf Category:
                          </p>
                          <p className="text-2xl font-bold text-green-400 group-hover:item:text-green-300 transition-colors duration-300">
                            {results.class}
                          </p>
                          <p className="text-lg mt-2 text-blue-400 font-semibold italic group-hover:item:text-blue-300 transition-colors duration-300">
                            Scientific Name:{" "}
                            <span className="italic">
                              {LEAF_SCIENTIFIC_NAMES[results.class] ||
                                "Unknown"}
                            </span>
                          </p>
                        </div>

                        <div className="bg-gray-800 bg-opacity-50 backdrop-blur-sm p-4 rounded-lg border border-gray-700 hover:border-blue-500 transition-colors duration-300">
                          <p className="text-gray-400 mb-1 text-sm">
                            Confidence:
                          </p>
                          <div className="flex items-center">
                            <p className="text-xl font-semibold text-blue-400">
                              {formattedConfidence}%
                            </p>
                            <div className="ml-4 flex-grow bg-gray-700 h-2 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-green-500 to-blue-500 relative"
                                style={{
                                  width: `${formattedConfidence}%`,
                                  transition: "width 1s ease-in-out",
                                }}
                              >
                                <div className="absolute inset-0 bg-white opacity-30 animate-pulse"></div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="bg-gray-800 bg-opacity-50 backdrop-blur-sm p-4 rounded-lg border border-gray-700 hover:border-blue-500 transition-colors duration-300">
                          <p className="text-gray-400 mb-2 text-sm">
                            Medicinal Properties:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {leafProperties.length > 0 ? (
                              leafProperties.map((property, index) => (
                                <span
                                  key={index}
                                  className="bg-gray-700 text-green-300 px-3 py-1 rounded-full text-xs font-medium hover:bg-gray-600 transition-colors duration-300"
                                >
                                  {property}
                                </span>
                              ))
                            ) : (
                              <p className="text-gray-400">
                                No medicinal properties listed.
                              </p>
                            )}
                          </div>
                        </div>
                      </>
                    )}

                    {results.confidence < 0.7 && (
                      <div className="bg-yellow-900 bg-opacity-20 p-4 rounded-lg flex items-start border border-yellow-800 animate-pulse">
                        <AlertCircle className="h-5 w-5 text-yellow-500 mr-2 flex-shrink-0 mt-0.5" />
                        <p className="text-yellow-200 text-sm">
                          Low confidence detection. Consider uploading a clearer
                          image with better lighting.
                        </p>
                      </div>
                    )}

                    {formattedConfidence >= 50 && (
                      <button
                        className="w-full bg-gradient-to-r from-blue-600 to-green-500 hover:from-blue-700 hover:to-green-600 text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center group/button transition-all duration-300"
                        onClick={handleDownloadReport}
                      >
                        <Download className="h-5 w-5 mr-2 group-hover/button:scale-110 transition-transform duration-300" />
                        <span>Download Report</span>
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-48 text-gray-500">
                    <div className="relative">
                      <Leaf className="h-16 w-16 mb-4 opacity-30" />
                      <div className="absolute inset-0 bg-green-500 rounded-full filter blur-md opacity-10"></div>
                    </div>
                    <p>Upload a leaf image to see analysis results</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          <Features />
        </div>
      </main>

      {/* Back to top button */}
      <button className="fixed bottom-6 right-6 p-2 bg-gray-800 bg-opacity-70 backdrop-blur-sm rounded-full shadow-lg hover:bg-gray-700 transition-all duration-300 group z-50">
        <ChevronsUp className="h-6 w-6 text-gray-300 group-hover:text-white transition-colors duration-300" />
      </button>

      <Footer />

      {/* CSS Animation Keyframes */}
      <style jsx global>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        @keyframes progressBar {
          0% {
            width: 0%;
          }
          100% {
            width: 100%;
          }
        }
        .animate-blob {
          animation: blob 7s infinite alternate;
        }
        .animate-progressBar {
          animation: progressBar 2s ease-in-out infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        .animate-fadeIn {
          animation: fadeIn 1s ease-in-out forwards;
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        .animate-slideUp {
          animation: slideUp 0.8s ease-out forwards;
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .scale-102 {
          transform: scale(1.02);
        }
      `}</style>
    </div>
  );
}
