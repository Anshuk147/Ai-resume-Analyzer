import React, { useState } from "react";
import axios from "axios";

function Home() {
  const [jdText, setJdText] = useState("");
  const [resumeFile, setResumeFile] = useState(null);
  const [matchData, setMatchData] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!resumeFile || !jdText.trim()) {
      alert("Please upload a resume and paste the job description.");
      return;
    }

    try {
      setLoading(true);
      setMatchData(null); // reset previous result

      // 1️⃣ Upload Resume PDF
      const formData = new FormData();
      formData.append("resume", resumeFile);

      const resumeResponse = await axios.post("https://ai-resume-backend-m4vu.onrender.com/upload", formData);
      const resumeText = resumeResponse.data.text;

      // 2️⃣ Upload JD Text
      const jdResponse = await axios.post("https://ai-resume-backend-m4vu.onrender.com/upload-jd", {
        jdText,
      });
      const parsedJD = jdResponse.data.jdText;

      // 3️⃣ Match using Gemini
      const matchResponse = await axios.post("https://ai-resume-backend-m4vu.onrender.com/match", {
        resumeText,
        jdText: parsedJD,
      });

      setMatchData(matchResponse.data);
    } catch (error) {
      console.error("Upload error:", error);
      alert("Something went wrong while uploading or matching.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section>
      <div className="mx-auto max-w-screen-xl min-h-screen px-4 py-12 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl">Resume Analyzer</h1>
          <p className="mt-4 text-lg text-gray-700">
            Upload your resume and paste the job description to get a match score.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-12 md:grid-cols-2 md:items-start">
          {/* JD Input */}
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 sm:text-3xl">
              Step 1: Paste Job Description
            </h2>
            <textarea
              className="w-full mt-4 p-3 rounded bg-white text-gray-800 shadow-md resize-none"
              rows="10"
              placeholder="Paste the job description..."
              value={jdText}
              onChange={(e) => setJdText(e.target.value)}
            ></textarea>
          </div>

          {/* Resume Upload */}
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 sm:text-3xl">
              Step 2: Upload Your Resume (PDF)
            </h2>
            <input
              type="file"
              accept=".pdf"
              className="mt-4 block w-full text-sm text-gray-900 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-gray-800 file:text-white hover:file:bg-gray-700"
              onChange={(e) => setResumeFile(e.target.files[0])}
            />
            {resumeFile && (
              <p className="mt-2 text-green-800 font-medium">✅ Selected: {resumeFile.name}</p>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <div className="mt-12 text-center">
          <button
            onClick={handleSubmit}
            className="inline-block rounded bg-gray-900 px-8 py-3 text-sm font-medium text-white hover:bg-gray-700 transition"
            disabled={loading}
          >
            {loading ? "Analyzing..." : "Analyze Resume"}
          </button>
        </div>

        {/* AI Result Display */}
        {matchData && (
          <div className="mt-16 bg-white rounded-lg shadow-lg p-8 max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-4 text-center">🎯 Match Results</h2>

            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-800">Overall Match Score</h3>
              <p className="text-2xl text-indigo-600 font-bold">{matchData.overallMatchScore}%</p>
            </div>

            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-800">✅ Matching Skills</h3>
              <div className="flex flex-wrap gap-2 mt-2">
                {matchData.matchingSkills?.map((skill, index) => (
                  <span
                    key={index}
                    className="bg-green-200 text-green-800 px-3 py-1 rounded-full text-sm font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-800">❌ Missing Skills</h3>
              <div className="flex flex-wrap gap-2 mt-2">
                {matchData.missingSkills?.map((skill, index) => (
                  <span
                    key={index}
                    className="bg-red-200 text-red-800 px-3 py-1 rounded-full text-sm font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-800">📝 Gemini Summary</h3>
              <p className="mt-2 text-gray-700 whitespace-pre-line">{matchData.summary}</p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export default Home;
