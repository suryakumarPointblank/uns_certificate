'use client'
import { useState, useRef, useEffect } from 'react';
import { Camera, Download, X, Check, Edit3, SwitchCamera } from 'lucide-react';

export default function ArthritisPledgeApp() {
  const [step, setStep] = useState('editor'); // preview, editor, complete
  const [name, setName] = useState('');
  const [photo, setPhoto] = useState(null);
  const [signature, setSignature] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [activeDialog, setActiveDialog] = useState(null); // 'name', 'photo', 'signature', null
  const [tempName, setTempName] = useState('');
  const [certificateDimensions, setCertificateDimensions] = useState({ width: 0, height: 0 });
  const [generatedCertificate, setGeneratedCertificate] = useState(null);
  const [facingMode, setFacingMode] = useState('user'); // 'user' for front camera, 'environment' for back camera

  const canvasRef = useRef(null);
  const videoRef = useRef(null);
  const certificateRef = useRef(null);
  const finalCanvasRef = useRef(null);
  const certificateImgRef = useRef(null);
  const [stream, setStream] = useState(null);

  // Certificate image URLs
  const certificateImageUrl = '/certificate.jpg'; // For editor view with placeholders
  const certificateFinalImageUrl = '/certificate_final.jpg'; // For final generation

  // Track certificate image dimensions for responsive positioning
  useEffect(() => {
    const updateDimensions = () => {
      if (certificateImgRef.current) {
        const rect = certificateImgRef.current.getBoundingClientRect();
        setCertificateDimensions({ width: rect.width, height: rect.height });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [step]);

  // Signature canvas setup
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      // Clear canvas - no background (transparent)
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      // Configure drawing style
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.strokeStyle = '#1e3a8a';
    }
  }, [activeDialog]);

  // Handle video stream when modal opens
  useEffect(() => {
    if (showPhotoModal && stream && videoRef.current) {
      const video = videoRef.current;
      video.srcObject = stream;

      // Wait for the video to be ready before playing
      const playVideo = async () => {
        try {
          await video.play();
        } catch (err) {
          // Only log if it's not an abort error (which happens during camera switch)
          if (err.name !== 'AbortError') {
            console.error('Error playing video:', err);
          }
        }
      };

      // Use loadedmetadata event to ensure video is ready
      video.addEventListener('loadedmetadata', playVideo);

      return () => {
        video.removeEventListener('loadedmetadata', playVideo);
      };
    }
  }, [showPhotoModal, stream]);

  const startDrawing = (e) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = ((e.touches ? e.touches[0].clientX : e.clientX) - rect.left) * scaleX;
    const y = ((e.touches ? e.touches[0].clientY : e.clientY) - rect.top) * scaleY;
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = ((e.touches ? e.touches[0].clientX : e.clientX) - rect.left) * scaleX;
    const y = ((e.touches ? e.touches[0].clientY : e.clientY) - rect.top) * scaleY;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      const canvas = canvasRef.current;
      setSignature(canvas.toDataURL());
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // No background - keep transparent
    setSignature(null);
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      setStream(mediaStream);
      setShowPhotoModal(true);
    } catch (err) {
      console.error('Camera error:', err);
      alert('Unable to access camera. Please check permissions.');
    }
  };

  const switchCamera = async () => {
    // Stop current stream
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    // Toggle facing mode
    const newFacingMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newFacingMode);
    // Start new stream with new facing mode
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: newFacingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      setStream(mediaStream);
      // The useEffect will handle setting srcObject and playing the video
    } catch (err) {
      console.error('Camera switch error:', err);
      alert('Unable to switch camera. Please try again.');
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) {
      alert('Camera not ready. Please wait a moment and try again.');
      return;
    }
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);
    const photoData = canvas.toDataURL('image/jpg', 0.9);
    setPhoto(photoData);
    stopCamera();
    setShowPhotoModal(false);
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const handleSubmit = () => {
    if (!name || !photo || !signature) {
      alert('Please complete all fields: name, photo, and signature');
      return;
    }

    // Track certificate generation event
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'generate_certificate', {
        event_category: 'engagement',
        event_label: 'Certificate Generated',
      });
    }

    generateCertificate();
  };

  const generateCertificate = () => {
    const canvas = finalCanvasRef.current;
    if (!canvas) {
      console.error('Canvas ref is null');
      return;
    }
    const ctx = canvas.getContext('2d');

    // Load certificate image
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onerror = (err) => {
      console.error('Error loading certificate image:', err);
      alert('Error loading certificate image. Please try again.');
    };

    img.onload = () => {
      console.log('Certificate image loaded:', img.width, 'x', img.height);
      canvas.width = img.width;
      canvas.height = img.height;

      // Draw certificate background
      ctx.drawImage(img, 0, 0);

      // Calculate responsive positions based on image dimensions
      const imgWidth = img.width;
      const imgHeight = img.height;

      // Position coordinates (responsive based on image size)
      // Name position
      ctx.fillStyle = '#33589e'; // Blue color
      ctx.font = `bold ${Math.round(imgWidth * (finalPositions.name.fontSize / 100))}px Barlow, sans-serif`;
      ctx.textAlign = 'left';
      const nameX = imgWidth * (finalPositions.name.x / 100);
      const nameY = imgHeight * (finalPositions.name.y / 100);
      console.log('Name position:', { nameX, nameY, finalPositions: finalPositions.name });
      ctx.fillText(name, nameX, nameY);

      // Photo position - circular photo (approximately 48% across, 68% down)
      if (photo) {
        const photoImg = new Image();
        photoImg.onerror = (err) => {
          console.error('Error loading photo:', err);
        };
        photoImg.onload = () => {
          console.log('Photo loaded:', photoImg.width, 'x', photoImg.height);
          ctx.save();
          // Create circular clip path for photo
          const photoX = imgWidth * (finalPositions.photo.x / 100); // Center X
          const photoY = imgHeight * (finalPositions.photo.y / 100); // Center Y
          const photoRadius = imgWidth * (finalPositions.photo.radius / 100); // Radius proportional to width
          console.log('Photo position:', { photoX, photoY, photoRadius, finalPositions: finalPositions.photo });

          ctx.beginPath();
          ctx.arc(photoX, photoY, photoRadius, 0, Math.PI * 2);
          ctx.closePath();
          ctx.clip();

          // Draw photo centered in circle
          const aspectRatio = photoImg.width / photoImg.height;
          let drawWidth, drawHeight;

          if (aspectRatio > 1) {
            drawHeight = photoRadius * 2;
            drawWidth = drawHeight * aspectRatio;
          } else {
            drawWidth = photoRadius * 2;
            drawHeight = drawWidth / aspectRatio;
          }

          ctx.drawImage(
            photoImg,
            photoX - drawWidth / 2,
            photoY - drawHeight / 2,
            drawWidth,
            drawHeight
          );
          ctx.restore();

          // Draw signature (approximately 61% across, 63% down)
          if (signature) {
            const sigImg = new Image();
            sigImg.onerror = (err) => {
              console.error('Error loading signature:', err);
            };
            sigImg.onload = () => {
              console.log('Signature loaded');
              const sigX = imgWidth * (finalPositions.signature.x / 100); // Left edge
              const sigY = imgHeight * (finalPositions.signature.y / 100); // Top edge
              const sigWidth = imgWidth * (finalPositions.signature.width / 100); // Width proportional
              const sigHeight = imgHeight * (finalPositions.signature.height / 100); // Height proportional
              console.log('Signature position:', { sigX, sigY, sigWidth, sigHeight, finalPositions: finalPositions.signature });

              ctx.drawImage(sigImg, sigX, sigY, sigWidth, sigHeight);

              console.log('Certificate generation complete');
              // Save the generated certificate as data URL
              setGeneratedCertificate(canvas.toDataURL('image/jpg'));
              setStep('complete');
            };
            sigImg.src = signature;
          } else {
            console.log('No signature provided');
            setGeneratedCertificate(canvas.toDataURL('image/jpg'));
            setStep('complete');
          }
        };
        photoImg.src = photo;
      } else {
        console.log('No photo provided');
        if (signature) {
          const sigImg = new Image();
          sigImg.onload = () => {
            const sigX = imgWidth * 0.578;
            const sigY = imgWidth * 0.605;
            const sigWidth = imgWidth * 0.22;
            const sigHeight = imgHeight * 0.105;
            ctx.drawImage(sigImg, sigX, sigY, sigWidth, sigHeight);
            setGeneratedCertificate(canvas.toDataURL('image/jpg'));
            setStep('complete');
          };
          sigImg.src = signature;
        } else {
          setGeneratedCertificate(canvas.toDataURL('image/jpg'));
          setStep('complete');
        }
      }
    };

    console.log('Loading certificate image from:', certificateFinalImageUrl);
    img.src = certificateFinalImageUrl;
  };

  const downloadCertificate = () => {
    if (!generatedCertificate) {
      alert('Certificate not ready yet. Please wait.');
      return;
    }
    const link = document.createElement('a');
    link.download = `Arthritis_Pledge_Certificate_${name.replace(/\s+/g, '_')}.jpg`;
    link.href = generatedCertificate;
    link.click();
  };

  // ========== POSITION CONFIGURATION ==========
  // Adjust these values to change where elements appear on the certificate
  // All values are percentages of image dimensions

  // Clickable area positions (where users click to edit)
  const clickableAreas = {
    name: { left: 38, top: 37, width: 35, height: 6 },
    photo: { left: 32, top: 63, width: 17, height: 20 },
    signature: { left: 53, top: 68, width: 17, height: 10 }
  };

  // Final render positions (where elements appear on generated certificate)
  const finalPositions = {
    name: {
      x: 41,        // Horizontal position (0-100)
      y: 41.4,      // Vertical position (0-100)
      fontSize: 2.8 // Font size as % of image width
    },
    photo: {
      x: 40.5,      // Center X position (0-100)
      y: 73,      // Center Y position (0-100)
      radius: 8   // Radius as % of image width
    },
    signature: {
      x: 53,      // Left edge X position (0-100)
      y: 67.5,      // Top edge Y position (0-100)
      width: 26,    // Width as % of image width (increased from 17)
      height: 15  // Height as % of image height (increased from 8)
    }
  };

  // Editor Screen with clickable areas
  if (step === 'editor') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-slate-50 to-gray-100 flex items-center justify-center p-4">
        {/* Hidden canvas for certificate generation */}
        <canvas ref={finalCanvasRef} style={{ display: 'none' }} />
        <div className="max-w-5xl w-full">
          <div className="text-center mb-8">
            {/* <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3 tracking-tight">World Arthritis Week 2025</h1> */}
            <p className="text-lg text-gray-600 font-medium">Click on the highlighted areas to add your details</p>
          </div>

          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden mb-8 relative">
            <div className="relative">
              <img
                ref={certificateImgRef}
                src={certificateImageUrl}
                alt="Certificate"
                className="w-full h-auto"
                onLoad={() => {
                  if (certificateImgRef.current) {
                    const rect = certificateImgRef.current.getBoundingClientRect();
                    setCertificateDimensions({ width: rect.width, height: rect.height });
                  }
                }}
              />

              {/* Clickable overlay areas */}
              {certificateDimensions.width > 0 && (
                <div className="absolute inset-0">
                  {/* DEV MODE: Uncomment to show position overlays */}
                  {/*
                  <div
                    className="absolute pointer-events-none"
                    style={{
                      left: `${finalPositions.name.x}%`,
                      top: `${finalPositions.name.y}%`,
                      width: '2px',
                      height: '2px',
                    }}
                    title="Name render position"
                  >
                    <div className="absolute -left-8 top-0 w-16 h-0.5 bg-orange-500"></div>
                    <div className="absolute left-0 -top-8 w-0.5 h-16 bg-orange-500"></div>
                    <span className="absolute -top-6 left-2 text-xs font-semibold text-orange-600 bg-white/90 px-1 rounded whitespace-nowrap">Name (baseline)</span>
                  </div>

                  <div
                    className="absolute border-2 border-dashed border-purple-500 bg-purple-500/5 rounded-full pointer-events-none"
                    style={{
                      left: `${finalPositions.photo.x - finalPositions.photo.radius}%`,
                      top: `${finalPositions.photo.y - finalPositions.photo.radius}%`,
                      width: `${finalPositions.photo.radius * 2}%`,
                      aspectRatio: '1 / 1',
                    }}
                    title="Photo render position"
                  >
                    <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-xs font-semibold text-purple-600 bg-white/90 px-1 rounded whitespace-nowrap">Photo</span>
                  </div>

                  <div
                    className="absolute border-2 border-dashed border-pink-500 bg-pink-500/5 pointer-events-none"
                    style={{
                      left: `${finalPositions.signature.x}%`,
                      top: `${finalPositions.signature.y}%`,
                      width: `${finalPositions.signature.width}%`,
                      height: `${finalPositions.signature.height}%`,
                    }}
                    title="Signature render position"
                  >
                    <span className="absolute -top-5 left-0 text-xs font-semibold text-pink-600 bg-white/90 px-1 rounded">Signature</span>
                  </div>
                  */}

                  {/* Clickable Areas with completion indicators */}
                  {/* Name Area */}
                  <div
                    onClick={() => setActiveDialog('name')}
                    className={`absolute cursor-pointer transition-all ${
                      name ? 'bg-emerald-500/10 hover:bg-emerald-500/20' : 'hover:bg-black/5'
                    }`}
                    style={{
                      left: `${clickableAreas.name.left}%`,
                      top: `${clickableAreas.name.top}%`,
                      width: `${clickableAreas.name.width}%`,
                      height: `${clickableAreas.name.height}%`,
                    }}
                    title="Click to add name"
                  >
                    {name && (
                      <div className="absolute -top-3 -right-3 bg-emerald-500 rounded-full p-1 shadow-lg">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>

                  {/* Photo Area */}
                  <div
                    onClick={() => setActiveDialog('photo')}
                    className={`absolute cursor-pointer rounded-full transition-all ${
                      photo ? 'bg-emerald-500/10 hover:bg-emerald-500/20' : 'hover:bg-black/5'
                    }`}
                    style={{
                      left: `${clickableAreas.photo.left}%`,
                      top: `${clickableAreas.photo.top}%`,
                      width: `${clickableAreas.photo.width}%`,
                      height: `${clickableAreas.photo.height}%`,
                    }}
                    title="Click to add photo"
                  >
                    {photo && (
                      <div className="absolute -top-3 -right-3 bg-emerald-500 rounded-full p-1 shadow-lg">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>

                  {/* Signature Area */}
                  <div
                    onClick={() => setActiveDialog('signature')}
                    className={`absolute cursor-pointer transition-all ${
                      signature ? 'bg-emerald-500/10 hover:bg-emerald-500/20' : 'hover:bg-black/5'
                    }`}
                    style={{
                      left: `${clickableAreas.signature.left}%`,
                      top: `${clickableAreas.signature.top}%`,
                      width: `${clickableAreas.signature.width}%`,
                      height: `${clickableAreas.signature.height}%`,
                    }}
                    title="Click to add signature"
                  >
                    {signature && (
                      <div className="absolute -top-3 -right-3 bg-emerald-500 rounded-full p-1 shadow-lg">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="text-center flex gap-4 justify-center">
            <button
              onClick={() => {
                if (!name || !photo || !signature) {
                  alert('Please complete all fields: name, photo, and signature');
                  return;
                }
                handleSubmit();
              }}
              className="bg-slate-900 hover:bg-slate-800 text-white font-semibold py-4 px-12 rounded-xl text-lg shadow-lg transition-all hover:shadow-xl disabled:opacity-50"
            >
              Generate Certificate
            </button>
          </div>

          {/* Legend */}
          {/* <div className="mt-6 flex flex-col items-center gap-3">
            <div className="flex justify-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-slate-400"></div>
                <span className="text-gray-600 font-medium">Clickable Areas</span>
              </div>
            </div>
            <div className="flex justify-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-dashed border-orange-500"></div>
                <span className="text-gray-600 font-medium">Name Position</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-dashed border-purple-500 rounded-full"></div>
                <span className="text-gray-600 font-medium">Photo Position</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-dashed border-pink-500"></div>
                <span className="text-gray-600 font-medium">Sign Position</span>
              </div>
            </div>
          </div> */}
        </div>

        {/* Name Dialog */}
        {activeDialog === 'name' && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl overflow-hidden max-w-md w-full shadow-2xl">
              <div className="bg-slate-900 text-white px-6 py-5 flex items-center justify-between">
                <h3 className="text-xl font-semibold">Add Your Name</h3>
                <button
                  onClick={() => {
                    setActiveDialog(null);
                    setTempName('');
                  }}
                  className="text-white/80 hover:text-white hover:bg-white/10 p-2 rounded-lg transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-8">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Full Name
                </label>
                <input
                  type="text"
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-slate-900 focus:ring-2 focus:ring-slate-200 focus:outline-none text-base transition-all text-gray-900 placeholder:text-gray-400 bg-white"
                  autoFocus
                />
                <button
                  onClick={() => {
                    setName(tempName);
                    setActiveDialog(null);
                    setTempName('');
                  }}
                  disabled={!tempName.trim()}
                  className="w-full mt-6 bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save Name
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Photo Dialog */}
        {activeDialog === 'photo' && !showPhotoModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl overflow-hidden max-w-md w-full shadow-2xl">
              <div className="bg-slate-900 text-white px-6 py-5 flex items-center justify-between">
                <h3 className="text-xl font-semibold">Add Your Photo</h3>
                <button
                  onClick={() => setActiveDialog(null)}
                  className="text-white/80 hover:text-white hover:bg-white/10 p-2 rounded-lg transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-8">
                {!photo ? (
                  <button
                    onClick={startCamera}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-5 rounded-lg flex items-center justify-center gap-3 transition-all shadow-lg"
                  >
                    <Camera className="w-6 h-6" />
                    <span className="text-lg">Capture Photo</span>
                  </button>
                ) : (
                  <div>
                    <img src={photo} alt="Captured" className="w-full rounded-lg mb-4 border border-gray-200" />
                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          setPhoto(null);
                          startCamera();
                        }}
                        className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold py-3 rounded-lg transition-all"
                      >
                        Retake
                      </button>
                      <button
                        onClick={() => setActiveDialog(null)}
                        className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3 rounded-lg transition-all"
                      >
                        Confirm
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Camera Modal */}
        {showPhotoModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl overflow-hidden max-w-2xl w-full shadow-2xl">
              <div className="bg-slate-900 text-white px-6 py-5 flex items-center justify-between">
                <h3 className="text-xl font-semibold">Capture Your Photo</h3>
                <button
                  onClick={() => {
                    stopCamera();
                    setShowPhotoModal(false);
                  }}
                  className="text-white/80 hover:text-white hover:bg-white/10 p-2 rounded-lg transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-8">
                <div className="bg-black rounded-lg overflow-hidden mb-6 relative">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-auto"
                    style={{ minHeight: '300px' }}
                  />
                  {/* Circular guide overlay */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="relative" style={{ width: '280px', height: '280px' }}>
                      <div className="absolute inset-0 border-4 border-white rounded-full opacity-80"></div>
                      <div className="absolute inset-0 border-4 border-blue-500 rounded-full opacity-50 animate-pulse"></div>
                      <p className="absolute -bottom-14 left-1/2 -translate-x-1/2 text-white text-sm font-semibold bg-black/50 px-3 py-1 rounded-full whitespace-nowrap">
                        Fit your face within the circle
                      </p>
                    </div>
                  </div>
                  {/* Camera switch button */}
                  <button
                    onClick={switchCamera}
                    className="absolute top-4 right-4 bg-white/90 hover:bg-white text-slate-900 p-3 rounded-full shadow-lg transition-all pointer-events-auto"
                    title="Switch camera"
                  >
                    <SwitchCamera className="w-6 h-6" />
                  </button>
                </div>
                <div className="flex gap-4">
                  <button
                    onClick={capturePhoto}
                    className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-semibold py-4 rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg"
                  >
                    <Camera className="w-5 h-5" />
                    Capture
                  </button>
                  <button
                    onClick={() => {
                      stopCamera();
                      setShowPhotoModal(false);
                    }}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold py-4 rounded-lg transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Signature Dialog */}
        {activeDialog === 'signature' && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50">
            <div className="bg-white rounded-2xl overflow-hidden w-full h-full sm:h-auto sm:max-w-4xl sm:w-full shadow-2xl flex flex-col">
              <div className="bg-slate-900 text-white px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between flex-shrink-0">
                <h3 className="text-lg sm:text-xl font-semibold">Add Your Signature</h3>
                <button
                  onClick={() => setActiveDialog(null)}
                  className="text-white/80 hover:text-white hover:bg-white/10 p-2 rounded-lg transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4 sm:p-8 flex-1 flex flex-col">
                <div className="border border-gray-300 rounded-lg bg-gray-50 shadow-sm overflow-hidden relative mb-4 sm:mb-6 flex-1 flex items-center justify-center min-h-0">
                  {!signature && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                      <div className="flex flex-col sm:flex-row items-center gap-2 text-gray-400 px-4 text-center">
                        <Edit3 className="w-5 h-5" />
                        <span className="text-sm sm:text-base font-medium">Sign here with your mouse or finger</span>
                      </div>
                    </div>
                  )}
                  <canvas
                    ref={canvasRef}
                    width={1000}
                    height={400}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="w-full h-full touch-none cursor-crosshair relative z-10"
                    style={{ maxHeight: '60vh' }}
                  />
                </div>
                <div className="flex gap-3 sm:gap-4 flex-shrink-0">
                  <button
                    onClick={clearSignature}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold py-3 sm:py-3 rounded-lg transition-all text-sm sm:text-base"
                  >
                    Clear
                  </button>
                  <button
                    onClick={() => setActiveDialog(null)}
                    disabled={!signature}
                    className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3 sm:py-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                  >
                    Confirm
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Form Screen
  if (step === 'form') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full">
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-6">
              <h2 className="text-3xl font-bold text-center">Complete Your Details</h2>
              <p className="text-center text-blue-100 mt-2">Fill in the information below to generate your certificate</p>
            </div>
            
            <div className="p-8 space-y-6">
              {/* Name Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full px-5 py-4 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none text-lg transition-all text-gray-900 placeholder:text-gray-400 bg-white"
                />
              </div>
              
              {/* Photo Section */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                  Profile Photo
                </label>
                
                {!photo ? (
                  <button
                    onClick={startCamera}
                    className="w-full bg-gradient-to-r from-lime-500 to-lime-600 hover:from-lime-600 hover:to-lime-700 text-white font-semibold py-6 rounded-xl flex items-center justify-center gap-3 transition-all shadow-lg hover:shadow-xl"
                  >
                    <Camera className="w-7 h-7" />
                    <span className="text-lg">Capture Photo</span>
                  </button>
                ) : (
                  <div className="relative">
                    <div className="flex items-center gap-4 p-4 bg-gradient-to-br from-lime-50 to-green-50 rounded-xl border-2 border-lime-500">
                      <img 
                        src={photo} 
                        alt="Captured" 
                        className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 text-green-700 font-semibold mb-2">
                          <Check className="w-5 h-5" />
                          Photo Captured
                        </div>
                        <button
                          onClick={() => {
                            setPhoto(null);
                            startCamera();
                          }}
                          className="text-blue-600 hover:text-blue-700 font-medium text-sm underline"
                        >
                          Retake Photo
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Signature Section */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                  Digital Signature
                </label>
                <div className="border-2 border-gray-300 rounded-xl bg-white shadow-inner overflow-hidden relative">
                  {!signature && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                      <div className="flex items-center gap-2 text-gray-400">
                        <Edit3 className="w-5 h-5" />
                        <span className="text-lg font-medium">Sign here with your mouse or finger</span>
                      </div>
                    </div>
                  )}
                  <canvas
                    ref={canvasRef}
                    width={800}
                    height={250}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="w-full touch-none cursor-crosshair relative z-10 bg-white"
                  />
                </div>
                <div className="flex items-center justify-between mt-3">
                  <p className="text-sm text-gray-600 font-medium">Draw your signature above</p>
                  <button
                    onClick={clearSignature}
                    className="text-red-600 hover:text-red-700 font-semibold text-sm flex items-center gap-1 px-3 py-1 rounded-lg hover:bg-red-50 transition-all"
                  >
                    <X className="w-4 h-4" />
                    Clear
                  </button>
                </div>
              </div>
            </div>
            
            {/* Footer Buttons */}
            <div className="bg-gray-50 px-8 py-6 flex gap-4">
              <button
                onClick={() => setStep('preview')}
                className="flex-1 bg-white border-2 border-gray-300 hover:border-gray-400 text-gray-700 font-semibold py-4 rounded-xl transition-all"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-4 rounded-xl transition-all shadow-lg hover:shadow-xl"
              >
                Generate Certificate
              </button>
            </div>
          </div>
        </div>
        
        {/* Camera Modal */}
        {showPhotoModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl overflow-hidden max-w-2xl w-full shadow-2xl">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 flex items-center justify-between">
                <h3 className="text-xl font-bold">Capture Your Photo</h3>
                <button
                  onClick={() => {
                    stopCamera();
                    setShowPhotoModal(false);
                  }}
                  className="text-white hover:bg-white/20 p-2 rounded-lg transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="p-6">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full rounded-xl"
                />
                <div className="flex gap-4 mt-6">
                  <button
                    onClick={capturePhoto}
                    className="flex-1 bg-gradient-to-r from-lime-500 to-lime-600 hover:from-lime-600 hover:to-lime-700 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg"
                  >
                    <Camera className="w-5 h-5" />
                    Capture
                  </button>
                  <button
                    onClick={() => {
                      stopCamera();
                      setShowPhotoModal(false);
                    }}
                    className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-4 rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Complete Screen
  if (step === 'complete') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-slate-50 to-gray-100 flex items-center justify-center p-4">
        <div className="max-w-5xl w-full">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-500 rounded-full mb-4">
              <Check className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-4xl font-bold text-gray-900 mb-2 tracking-tight">Certificate Generated!</h2>
            <p className="text-lg text-gray-600 font-medium">Your pledge certificate is ready to download</p>
          </div>

          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden mb-8">
            {generatedCertificate ? (
              <img
                src={generatedCertificate}
                alt="Generated Certificate"
                className="w-full h-auto"
              />
            ) : (
              <div className="flex items-center justify-center p-12">
                <p className="text-gray-500">Generating certificate...</p>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={downloadCertificate}
              className="bg-slate-900 hover:bg-slate-800 text-white font-semibold py-4 px-12 rounded-xl flex items-center justify-center gap-3 text-lg shadow-lg transition-all hover:shadow-xl"
            >
              <Download className="w-5 h-5" />
              Download Certificate
            </button>
            <button
              onClick={() => {
                setStep('editor');
                setName('');
                setPhoto(null);
                setSignature(null);
                setGeneratedCertificate(null);
              }}
              className="bg-white border-2 border-slate-900 text-slate-900 hover:bg-slate-50 font-semibold py-4 px-12 rounded-xl text-lg transition-all"
            >
              Create Another
            </button>
          </div>
        </div>
      </div>
    );
  }
}