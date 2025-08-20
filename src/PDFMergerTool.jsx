import React, { useState, useRef, useCallback } from 'react';
import { PDFDocument } from 'pdf-lib';

const PDFMergerTool = () => {
  const [pdfFiles, setPdfFiles] = useState([]);
  const [status, setStatus] = useState({ message: 'Please upload PDF files to begin', type: 'info' });
  const [progress, setProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef(null);
  const maxFileSize = 10 * 1024 * 1024; // 10MB

  const handleFileSelection = useCallback((files) => {
    if (files.length === 0) return;
    
    let filesAdded = 0;
    const newFiles = [...pdfFiles];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Validate file type
      if (file.type !== 'application/pdf') {
        setStatus({ message: 'Error: Only PDF files are allowed', type: 'error' });
        continue;
      }
      
      // Validate file size
      if (file.size > maxFileSize) {
        setStatus({ message: `Error: ${file.name} is too large (max 10MB)`, type: 'error' });
        continue;
      }
      
      // Check if file already exists
      if (newFiles.some(f => f.name === file.name && f.size === file.size)) {
        setStatus({ message: `Warning: ${file.name} is already added`, type: 'error' });
        continue;
      }
      
      // Add file to our list
      newFiles.push(file);
      filesAdded++;
    }
    
    if (filesAdded > 0) {
      setPdfFiles(newFiles);
      setStatus({ message: `Added ${filesAdded} PDF file(s)`, type: 'success' });
    }
  }, [pdfFiles]);

  const handleInputChange = (e) => {
    handleFileSelection(e.target.files);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    handleFileSelection(e.dataTransfer.files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.style.backgroundColor = '#e8f4ff';
    e.currentTarget.style.borderColor = '#2980b9';
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.style.backgroundColor = '#f8fafc';
    e.currentTarget.style.borderColor = '#3498db';
  };

  const removeFile = (index) => {
    const newFiles = [...pdfFiles];
    const removedFile = newFiles[index].name;
    newFiles.splice(index, 1);
    setPdfFiles(newFiles);
    setStatus({ message: `Removed: ${removedFile}`, type: 'success' });
  };

  const resetApp = () => {
    setPdfFiles([]);
    setStatus({ message: 'Upload PDF files to begin', type: 'info' });
    setProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const mergePdfs = async () => {
    if (pdfFiles.length === 0) {
      setStatus({ message: 'No PDF files to merge', type: 'error' });
      return;
    }
    
    setIsProcessing(true);
    setStatus({ message: 'Merging PDFs...', type: 'info' });
    
    try {
      const mergedPdf = await PDFDocument.create();
      
      for (let i = 0; i < pdfFiles.length; i++) {
        const file = pdfFiles[i];
        
        // Update progress
        setProgress((i / pdfFiles.length) * 100);
        setStatus({ message: `Processing ${i+1} of ${pdfFiles.length}: ${file.name}`, type: 'info' });
        
        try {
          // Read the file as array buffer
          const fileBytes = await readFileAsArrayBuffer(file);
          
          // Load the PDF document
          const pdf = await PDFDocument.load(fileBytes);
          
          // Copy all pages from the current PDF
          const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
          
          // Add all copied pages to the merged PDF
          pages.forEach(page => {
            mergedPdf.addPage(page);
          });
        } catch (error) {
          console.error(`Error processing ${file.name}:`, error);
          setStatus({ message: `Error processing ${file.name}. It may be corrupted or encrypted.`, type: 'error' });
          continue;
        }
      }
      
      // Save the merged PDF
      const mergedPdfBytes = await mergedPdf.save();
      
      // Create a Blob from the merged PDF bytes
      const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'merged-document.pdf';
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
      
      // Update progress to complete
      setProgress(100);
      setStatus({ message: 'PDFs merged successfully! Download started.', type: 'success' });
      
    } catch (error) {
      console.error('Error merging PDFs:', error);
      setStatus({ message: 'Error merging PDFs. Please try again.', type: 'error' });
    } finally {
      setIsProcessing(false);
      
      // Reset progress after a delay
      setTimeout(() => {
        setProgress(0);
      }, 2000);
    }
  };

  const readFileAsArrayBuffer = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' bytes';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  return (
    <div style={{
      background: 'linear-gradient(135deg, #fcfaffff 0%, #fefffbff 100%))',
      minHeight: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '15px',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
        width: '100%',
        maxWidth: '600px',
        padding: '30px',
        textAlign: 'center'
      }}>
        <h1 style={{
          color: '#2c3e50',
          marginBottom: '20px',
          fontWeight: '600'
        }}>PDF Merger Tool</h1>
        
        <p style={{
          color: '#7f8c8d',
          marginBottom: '30px',
          lineHeight: '1.5'
        }}>Upload multiple PDF files and combine them into a single PDF document</p>
        
        <div style={{
          backgroundColor: '#fff4e6',
          borderLeft: '4px solid #e67e22',
          padding: '15px',
          margin: '20px 0',
          textAlign: 'left',
          borderRadius: '4px'
        }}>
          <h3 style={{ color: '#e67e22', marginBottom: '10px' }}>How to use:</h3>
          <ol style={{ paddingLeft: '20px' }}>
            <li style={{ marginBottom: '8px' }}>Click "Select PDF Files" or drag & drop files into the upload area</li>
            <li style={{ marginBottom: '8px' }}>Review your selected files in the list</li>
            <li style={{ marginBottom: '8px' }}>Click "Merge PDFs" to combine them into a single file</li>
            <li>Use "Reset" to clear all files and start over</li>
          </ol>
        </div>
        
        <div 
          style={{
            border: '3px dashed #3498db',
            borderRadius: '12px',
            padding: '40px 20px',
            marginBottom: '25px',
            backgroundColor: '#f8fafc',
            transition: 'all 0.3s',
            cursor: 'pointer'
          }}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
        >
          <div style={{ fontSize: '50px', color: '#3498db', marginBottom: '15px' }}>📄</div>
          <p>Drag & drop PDF files here or click the button below</p>
          <button style={{
            backgroundColor: '#3498db',
            color: 'white',
            padding: '12px 25px',
            border: 'none',
            borderRadius: '50px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: '600',
            transition: 'background-color 0.3s',
            display: 'inline-block',
            marginTop: '15px'
          }}>Select PDF Files</button>
          <input 
            type="file" 
            ref={fileInputRef}
            style={{ display: 'none' }}
            accept=".pdf" 
            multiple 
            onChange={handleInputChange}
          />
        </div>
        
        <div style={{
          margin: '25px 0',
          maxHeight: '250px',
          overflowY: 'auto',
          textAlign: 'left',
          border: '1px solid #e0e0e0',
          borderRadius: '8px',
          padding: '15px',
          backgroundColor: '#f9f9f9'
        }}>
          {pdfFiles.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#7f8c8d', fontStyle: 'italic', padding: '20px' }}>
              No files selected yet
            </div>
          ) : (
            pdfFiles.map((file, index) => (
              <div 
                key={`${file.name}-${file.size}-${index}`}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 15px',
                  borderBottom: '1px solid #eee',
                  transition: 'background-color 0.2s',
                  animation: 'fadeIn 0.3s ease-in'
                }}
              >
                <span>{file.name} ({formatFileSize(file.size)})</span>
                <button 
                  style={{
                    backgroundColor: '#e74c3c',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '5px 10px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    transition: 'background-color 0.2s'
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(index);
                  }}
                >
                  Remove
                </button>
              </div>
            ))
          )}
        </div>
        
        <div style={{
          height: '6px',
          backgroundColor: '#f0f0f0',
          borderRadius: '3px',
          margin: '15px 0',
          overflow: 'hidden'
        }}>
          <div style={{
            height: '100%',
            backgroundColor: '#3498db',
            width: `${progress}%`,
            transition: 'width 0.3s'
          }}></div>
        </div>
        
        <div style={{
          margin: '20px 0',
          padding: '12px',
          borderRadius: '8px',
          fontWeight: '500',
          backgroundColor: status.type === 'success' ? '#d4edda' : 
                          status.type === 'error' ? '#f8d7da' : '#cce5ff',
          color: status.type === 'success' ? '#155724' : 
                status.type === 'error' ? '#721c24' : '#004085',
          border: `1px solid ${status.type === 'success' ? '#c3e6cb' : 
                            status.type === 'error' ? '#f5c6cb' : '#b8daff'}`
        }}>
          {status.message}
        </div>
        
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '15px',
          marginTop: '25px',
          flexDirection: window.innerWidth <= 600 ? 'column' : 'row'
        }}>
          <button 
            style={{
              backgroundColor: '#2ecc71',
              color: 'white',
              padding: '14px 30px',
              border: 'none',
              borderRadius: '50px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '600',
              transition: 'background-color 0.3s',
              flex: window.innerWidth <= 600 ? '1' : '2',
              opacity: isProcessing || pdfFiles.length === 0 ? 0.6 : 1,
              pointerEvents: isProcessing || pdfFiles.length === 0 ? 'none' : 'auto'
            }}
            onClick={mergePdfs}
            disabled={isProcessing || pdfFiles.length === 0}
          >
            Merge PDFs
          </button>
          <button 
            style={{
              backgroundColor: '#e67e22',
              color: 'white',
              padding: '14px 25px',
              border: 'none',
              borderRadius: '50px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '600',
              transition: 'background-color 0.3s',
              flex: window.innerWidth <= 600 ? '1' : '1'
            }}
            onClick={resetApp}
          >
            Reset
          </button>
        </div>
      </div>
      
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @media (max-width: 600px) {
          .container {
            padding: 20px;
          }
        }
      `}</style>
    </div>
  );
};

export default PDFMergerTool;
