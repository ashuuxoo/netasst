// Function to handle image click and show video popup
const setupVideoPopup = () => {
  document.body.addEventListener('click', (event) => {
    const img = event.target.closest('img[slot]');
    if (!img) return; // Ignore clicks outside of images with the 'slot' attribute
    const slotValue = img.getAttribute('slot');
    // Request matching slot data from netflee-data.js
    window.getNetfleeBySlot(slotValue, (matchingVideos) => {
      if (matchingVideos && matchingVideos.length > 0) {
        handleVideoPopup(img, matchingVideos);
      }
    });
  });
};

// Move all popup logic into this function:
function handleVideoPopup(img, matchingVideos) {
  const trailer = img.getAttribute('trailer'); // Get trailer URL from the image
  let currentSeasonIndex = 0; // Default to the first season
  let currentIndex = 0; // Default to the first video/audio URL
  let videoLinks = matchingVideos[currentSeasonIndex].link;
  let audioLinks = matchingVideos[currentSeasonIndex].audio;
  const videoTitle = img.nextElementSibling?.textContent || 'Untitled Video'; // Get title from <p> tag
  const poster = img.getAttribute('saver') || img.src; // Use the image source as the poster

  if (videoLinks) {
    const urls = videoLinks;
    const audioUrls = audioLinks || [];

    // Create preview page
    const createPreviewPage = () => {
      const originalTitle = document.title; // Save current page title
      document.title = videoTitle; // Set page title to videoTitle
      const previewPage = document.createElement('div');
      previewPage.style.position = 'fixed';
      previewPage.style.top = '0';
      previewPage.style.left = '0';
      previewPage.style.width = '100vw';
      previewPage.style.height = '100vh';
      previewPage.style.backgroundColor = 'rgba(0, 0, 0, 0.51)';
      previewPage.style.backdropFilter = 'blur(18px)';
      previewPage.style.color = 'white';
      previewPage.style.zIndex = '11000';
      previewPage.style.overflowY = 'auto';
      // --- Slide in animation ---
      previewPage.style.transform = 'translateX(100vw)';
      previewPage.style.transition = 'transform 0.55s cubic-bezier(0.4,0,0.2,1)';
      setTimeout(() => {
        previewPage.style.transform = 'translateX(0)';
      }, 10);

      // Add poster image
      const posterImg = document.createElement('video');
      posterImg.src = trailer;
      posterImg.style.display = 'block';
      posterImg.style.background = 'black';
      posterImg.style.marginLeft = '0';
      posterImg.style.marginTop = '0';
      posterImg.style.boxShadow = 'grey 0.2em 0.2em 0.5em';
      posterImg.style.width = '100%';
      posterImg.style.height = '13em';
      posterImg.poster = poster;
      posterImg.style.objectFit = 'cover';
      posterImg.controls = false; // Remove default controls
      posterImg.autoplay = true;
      posterImg.muted = true;
      posterImg.addEventListener('click', () => {
        if (posterImg.muted) {
          posterImg.muted= false;
        } else {
          posterImg.muted = true;
        }
      });
      previewPage.appendChild(posterImg);

      // Add title
      const title = document.createElement('p');
      title.textContent = videoTitle;
      title.style.textAlign = 'left';
      title.style.fontSize = '20px';
      title.style.marginTop = '0.5em';
      title.style.color = 'white';
      title.style.marginLeft = '1em';
      title.style.width = '80%';
      previewPage.appendChild(title);

      // Add season selector
      if (matchingVideos.length > 1) {
        const seasonSelector = document.createElement('select');
        seasonSelector.style.display = 'block';
        seasonSelector.style.margin = '10px 0';
        seasonSelector.style.marginLeft = '1em';
        seasonSelector.style.padding = '0.5em';
        seasonSelector.style.borderRadius = '5px';
        seasonSelector.style.backgroundColor = 'white';
        seasonSelector.style.color = 'black';
        seasonSelector.style.border = '1px solid #ccc';
        
        matchingVideos.forEach((_, index) => {
          const option = document.createElement('option');
          option.value = index;
          option.textContent = `Season ${index + 1}`;
          seasonSelector.appendChild(option);
        });
        seasonSelector.addEventListener('change', (event) => {
          currentSeasonIndex = parseInt(event.target.value, 10);
          videoLinks = matchingVideos[currentSeasonIndex].link;
          audioLinks = matchingVideos[currentSeasonIndex].audio;
          currentIndex = 0; // Reset to the first video/audio URL
          renderEpisodeButtons(); // Update episode buttons for new season
        });
        previewPage.appendChild(seasonSelector);
      }

      // Add play button
      const playButton = document.createElement('button');
       // Check if there is saved progress for the first video URL
      let savedData = {};
      try {
        savedData = JSON.parse(localStorage.getItem('videoProgress')) || {};
      } catch (e) {
        savedData = {};
      }
      const firstVideoSrc = urls[0];
      if (savedData[firstVideoSrc] && savedData[firstVideoSrc].progress > 0) {
        playButton.textContent = 'Resume';
      } else {
        playButton.textContent = 'Play';
      }
      playButton.style.display = 'block';
      playButton.style.marginTop = '0.7em';
      playButton.style.marginLeft = '5%';
      playButton.style.width = '90%';
      playButton.style.padding = '1em 2em';
      playButton.style.borderRadius = '1em';
      playButton.style.backgroundColor = 'white';
      playButton.style.color = 'black';
      playButton.style.fontWeight = 'bolder';
      playButton.style.border = 'none';
      playButton.style.cursor = 'pointer';
      playButton.addEventListener('click', () => {
        posterImg.pause();
        const updatedVideoLinks = matchingVideos[currentSeasonIndex].link;
        const updatedAudioLinks = matchingVideos[currentSeasonIndex].audio;
        createVideoPopup(currentIndex, updatedVideoLinks, updatedAudioLinks); // Pass updated links
      });
      previewPage.appendChild(playButton);

      // Add wishlist button
      const wishlistButton = document.createElement('button');
      wishlistButton.textContent = 'Add to Wishlist';
      wishlistButton.style.display = 'block';
      wishlistButton.style.marginTop = '0.7em';
      wishlistButton.style.marginLeft = '5%';
      wishlistButton.style.width = '90%';
      wishlistButton.style.padding = '1em 2em';
      wishlistButton.style.borderRadius = '1em';
      wishlistButton.style.backgroundColor = '#ffcc00';
      wishlistButton.style.color = 'black';
      wishlistButton.style.fontWeight = 'bolder';
      wishlistButton.style.border = 'none';
      wishlistButton.style.cursor = 'pointer';
      wishlistButton.addEventListener('click', () => {
        const parentDiv = img.closest('div'); // Get the parent div of the clicked image
        if (!parentDiv) return;

        const watchlistDiv = document.querySelector('.watchlist');
        if (watchlistDiv) {
          // Check if the same element already exists in the watchlist
          const existingItems = Array.from(watchlistDiv.children);
          const isDuplicate = existingItems.some((item) => item.isEqualNode(parentDiv));
          wishlistButton.textContent= 'Already Added';

          if (!isDuplicate) {
            const clonedDiv = parentDiv.cloneNode(true); // Clone the parent div with its children
            clonedDiv.querySelectorAll('button').forEach((btn) => btn.remove()); // Remove buttons from the cloned div
            watchlistDiv.appendChild(clonedDiv); // Append the cloned div to the .watchlist div
            wishlistButton.style.backgroundColor = 'green';
            wishlistButton.textContent = 'Added';

            // Save to localStorage
            const watchlistHTML = watchlistDiv.innerHTML;
            localStorage.setItem('watchlist', watchlistHTML);
          }
        }
      });
      previewPage.appendChild(wishlistButton);

       if (img.alt && img.alt.trim() !== '') {
          // Check subscription value in localStorage
          const subscription = localStorage.getItem('subscription');
          if (subscription) {
            const downloadButton = document.createElement('button');
            downloadButton.textContent = 'Download';
            downloadButton.setAttribute('id','dwnnetflee');
            downloadButton.style.display = 'block';
            downloadButton.style.marginTop = '0.7em';
            downloadButton.style.marginLeft = '5%';
            downloadButton.style.width = '90%';
            downloadButton.style.padding = '1em 2em';
            downloadButton.style.borderRadius = '1em';
            downloadButton.style.backgroundColor = '#007bff';
            downloadButton.style.color = 'white';
            downloadButton.style.fontWeight = 'bolder';
            downloadButton.style.border = 'none';
            downloadButton.style.cursor = 'pointer';
            downloadButton.addEventListener('click', () => {
              downloadButton.style.backgroundColor = 'green';
              downloadButton.textContent = 'Downloading...';
              window.location.href = img.alt; // Redirect to the download link
            });
            previewPage.appendChild(downloadButton);
          }
        }

      // --- Add episodes button group ---
      let episodesContainer;
      // Only show episodesContainer if not a film
      const isFilm = !!matchingVideos[currentSeasonIndex]?.for && matchingVideos[currentSeasonIndex].for === "film";
      if (!isFilm) {
        episodesContainer = document.createElement('div');
        episodesContainer.style.display = 'flex';
        episodesContainer.style.flexDirection = 'column';
        episodesContainer.style.gap = '0.7em';
        episodesContainer.style.marginTop = '0.7em';
        episodesContainer.style.marginLeft = '5%';
        episodesContainer.style.width = '90%';

        // Helper to create episode buttons (Netflix vertical style)
        function renderEpisodeButtons() {
          episodesContainer.innerHTML = '';
          const epCount = (videoLinks && videoLinks.length) || 0;
          // Check for episode titles array in current set
          const episodeTitles = matchingVideos[currentSeasonIndex]?.title;
          for (let i = 0; i < epCount; i++) {
            // Row container for episode
            const epRow = document.createElement('div');
            epRow.style.display = 'flex';
            epRow.style.alignItems = 'center';
            epRow.style.background = '#181818';
            epRow.style.borderRadius = '0.7em';
            epRow.style.boxShadow = '0 2px 8px rgba(0,0,0,0.18)';
            epRow.style.cursor = 'pointer';
            epRow.style.padding = '0.5em 0.7em';
            epRow.style.transition = 'background 0.15s';
            epRow.onmouseover = () => epRow.style.background = '#232323';
            epRow.onmouseout = () => epRow.style.background = '#181818';

            // Left: Episode image with progress bar overlay
            const epImgBox = document.createElement('div');
            epImgBox.style.position = 'relative';
            epImgBox.style.width = '7em';
            epImgBox.style.height = '4em';
            epImgBox.style.flexShrink = '0';
            epImgBox.style.marginRight = '1em';

            const epImg = document.createElement('img');
            epImg.src = poster;
            epImg.alt = `Episode ${i + 1}`;
            epImg.style.width = '100%';
            epImg.style.height = '100%';
            epImg.style.display = 'block';
            epImg.style.objectFit = 'cover';
            epImg.style.borderRadius = '0.5em';
            epImgBox.appendChild(epImg);

            // Progress bar overlay (bottom of image)
            const progressBar = document.createElement('div');
            progressBar.style.position = 'absolute';
            progressBar.style.left = '0';
            progressBar.style.bottom = '0';
            progressBar.style.width = '100%';
            progressBar.style.height = '0.35em';
            progressBar.style.background = '#333';
            progressBar.style.borderRadius = '0 0 0.5em 0.5em';
            progressBar.style.overflow = 'hidden';

            // Get progress from localStorage
            let progress = 0;
            try {
              const videoProgress = JSON.parse(localStorage.getItem('videoProgress')) || {};
              const epSrc = videoLinks[i];
              if (videoProgress[epSrc] && epSrc) {
                let fakeDuration = 40 * 60;
                progress = Math.min(1, (videoProgress[epSrc].progress || 0) / fakeDuration);
              }
            } catch {}
            const progressInner = document.createElement('div');
            progressInner.style.height = '100%';
            progressInner.style.background = '#e50914';
            progressInner.style.width = `${Math.round(progress * 100)}%`;
            progressBar.appendChild(progressInner);
            epImgBox.appendChild(progressBar);

            epRow.appendChild(epImgBox);

            // Right: Episode info (number and name)
            const epInfo = document.createElement('div');
            epInfo.style.display = 'flex';
            epInfo.style.flexDirection = 'column';
            epInfo.style.justifyContent = 'center';

            const epNum = document.createElement('div');
            // Use title from array if available, else fallback to "Episode N"
            if (Array.isArray(episodeTitles) && episodeTitles[i]) {
              epNum.textContent = episodeTitles[i];
            } else {
              epNum.textContent = `Episode ${i + 1}`;
            }
            epNum.style.color = '#fff';
            epNum.style.fontWeight = 'bold';
            epNum.style.fontSize = '1.1em';
            epNum.style.marginBottom = '0.2em';
            epInfo.appendChild(epNum);

            // Optionally, add more info here (e.g., episode title/description)
            epRow.appendChild(epInfo);

            // Click handler
            epImg.addEventListener('click', () => {
              posterImg.pause();
              const updatedVideoLinks = matchingVideos[currentSeasonIndex].link;
              const updatedAudioLinks = matchingVideos[currentSeasonIndex].audio;
              currentIndex = i;
              createVideoPopup(currentIndex, updatedVideoLinks, updatedAudioLinks);
            });

            episodesContainer.appendChild(epRow);
          }
        }
        renderEpisodeButtons();
        previewPage.appendChild(episodesContainer);
      }

      // Add description
      const description = document.createElement('p');
      description.textContent = img.title || videoTitle;
      description.className = 'description';
      description.style.marginTop = '20px';
      description.style.marginLeft = '3%';
      description.style.padding = '10px';
      description.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
      description.style.borderRadius = '10px';
      description.style.color = 'white';
      description.style.fontSize = '14px';
      description.style.width = '90%';
      previewPage.appendChild(description);

      // Add random grid view
      const addRandomGridView = () => {
        const allInnerDivs = Array.from(document.querySelectorAll('.box div')); // Select all inner divs of .box
        const randomInnerDivs = allInnerDivs
          .sort(() => 0.5 - Math.random()) // Shuffle the array
          .slice(0, 6); // Take 6 random inner divs
    
        const gridContainer = document.createElement('div');
        gridContainer.style.display = 'grid';
        gridContainer.style.gridTemplateColumns = '1fr 1fr 1fr'; // 3 columns
        gridContainer.style.gap = '10px'; // Add spacing between boxes
        gridContainer.style.margin = '1em';
        gridContainer.style.width = '90%';
        gridContainer.style.marginLeft = '5%';
        gridContainer.style.marginBottom= '3em';
    
        randomInnerDivs.forEach((innerDiv) => {
          const clonedInnerDiv = innerDiv.cloneNode(true); // Clone the inner div element with its children
          clonedInnerDiv.style.position = 'relative';
          clonedInnerDiv.style.overflow = 'hidden';
          clonedInnerDiv.style.borderRadius = '0.5em';
          clonedInnerDiv.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
          clonedInnerDiv.style.backgroundColor = '#000';
    
          // Hide all child elements except <img>
          Array.from(clonedInnerDiv.children).forEach((child) => {
            if (child.tagName !== 'IMG') {
              child.style.display = 'none';
            } else {
              child.style.width = '100%';
              child.style.height = '10em';
              child.style.objectFit = 'cover';
              child.style.borderRadius = '0.5em';
            }
          });
    
          // Add click event to open new preview and close the current one
          clonedInnerDiv.addEventListener('click', () => {
            document.body.removeChild(previewPage); // Close the current preview page
            const slotValue = clonedInnerDiv.getAttribute('slot'); // Get slot value if available
            if (slotValue) {
              const matchingVideos = netflee.filter((item) => item.slot === slotValue);
              if (matchingVideos.length > 0) {
                currentSeasonIndex = 0; // Reset to the first season
                currentIndex = 0; // Reset to the first video/audio URL
                videoLinks = matchingVideos[currentSeasonIndex].link;
                audioLinks = matchingVideos[currentSeasonIndex].audio;
                createPreviewPage(); // Open a new preview page
              }
            }
          });
    
          gridContainer.appendChild(clonedInnerDiv);
        });
    
        previewPage.appendChild(gridContainer);
      };
    
      addRandomGridView(); // Call the function to add the grid view

      // Add close button
      const closeButton = document.createElement('button');
      closeButton.textContent = '×';
      closeButton.style.position = 'fixed';
      closeButton.style.top = '2.5em';
      closeButton.style.right = '1em';
      closeButton.style.padding = '10px';
      closeButton.style.borderRadius = '1em';
      closeButton.style.backgroundColor = 'red';
      closeButton.style.color = 'white';
      closeButton.style.border = 'none';
      closeButton.style.cursor = 'pointer';
      closeButton.addEventListener('click', () => {
        document.body.removeChild(previewPage); // Remove preview page
        document.title = originalTitle; // Restore original page title
        window.removeEventListener('popstate', handlePopState);
        // Go forward in history if the state was just added
        if (history.state && history.state.previewOpen) {
          history.back();
        }
      });
      previewPage.appendChild(closeButton);
      document.body.appendChild(previewPage);

      // Push a new state to the history stack
      history.pushState({ previewOpen: true }, '');

      // Handler to close previewPage on back navigation
      const handlePopState = (event) => {
        if (document.body.contains(previewPage)) {
          closeButton.click();
        }
      };
      window.addEventListener('popstate', handlePopState);
    };
    createPreviewPage(); // Show the preview page

    const createVideoPopup = (index, videoLinks, audioLinks) => {
      const videoSrc = videoLinks[index];
      const audioSrc = audioLinks ? audioLinks[index] : null; // Handle missing audio field
      if (!videoSrc) {
        const toast = document.getElementById('toast');
          if (toast) {
          toast.innerText = "Coming Soon";
          toast.style.display = 'block';
          setTimeout(() => {
            toast.style.display = 'none';
          }, 2000);
          }
        return;
      }

      // Find if current set has download: true
      const hasDownload = !!matchingVideos[currentSeasonIndex]?.download;

      // Create video popup container
      const videoPopup = document.createElement('div');
      videoPopup.style.position = 'fixed';
      videoPopup.setAttribute('class', 'video-popup');
      videoPopup.style.top = '0';
      videoPopup.style.left = '0';
      videoPopup.style.width = '100%';
      videoPopup.style.height = '100%';
      videoPopup.style.backgroundColor = 'rgb(0, 0, 0)';
      videoPopup.style.display = 'flex';
      videoPopup.style.justifyContent = 'center';
      videoPopup.style.alignItems = 'center';
      videoPopup.style.zIndex = '12000';
      videoPopup.style.transform = 'rotate(0deg)'; // Default orientation

      // Force landscape orientation when fullscreen
      const enforceLandscape = () => {
        if (
          document.fullscreenElement ||
          document.webkitFullscreenElement ||
          document.mozFullScreenElement ||
          document.msFullscreenElement
        ) {
          if (screen.orientation && screen.orientation.lock) {
            screen.orientation.lock('landscape').catch((err) => {
              console.warn('Failed to lock orientation:', err);
            });
          } else {
            videoPopup.style.transform = 'rotate(90deg)';
            videoPopup.style.transformOrigin = 'center';
          }
        } else {
          videoPopup.style.transform = 'rotate(0deg)';
        }
      };

      document.addEventListener('fullscreenchange', enforceLandscape);
      document.addEventListener('webkitfullscreenchange', enforceLandscape);
      document.addEventListener('mozfullscreenchange', enforceLandscape);
      document.addEventListener('MSFullscreenChange', enforceLandscape);


      // Create video element
      const video = document.createElement('video');
      video.src = videoSrc;
      video.preload = 'auto'; // Hint browser to preload for quick start
      video.load(); // Start loading immediately
      video.controls = false; // Remove default controls
      video.autoplay = true;
      video.muted = false;
      video.style.width = '100%';
      video.style.height = '100%';
      video.poster = poster; // Placeholder image
      video.style.margin = '0';
      video.style.position = 'relative';

      let networkLost = false;
      let retryOnRestore = false;
      window.addEventListener('offline', () => {
        networkLost = true;
        retryOnRestore = true;
      });
      window.addEventListener('online', () => {
        if (retryOnRestore) {
          video.src = videoSrc; // Reset video source
          video.load();
          const savedData = JSON.parse(localStorage.getItem('videoProgress')) || {};
          if (savedData[video.src] && savedData[video.src].progress !== undefined) {
            video.currentTime = savedData[video.src].progress;
          }
          video.play().catch((error) => {});
           if (audioSrc) {
              audio.load();
              audio.src = audioSrc; // Reset audio source
              audio.currentTime = video.currentTime; // Sync audio with video
              audio.play().catch((error) => {});
            }
          retryOnRestore = false;
          networkLost = false;
        }
      });

      // Create audio element
      const audio = document.createElement('audio');
      if (audioSrc) { // Only create and sync audio if audioSrc exists
        audio.src = audioSrc;
        audio.preload = 'auto'; // Hint browser to preload audio
        audio.load();
        audio.autoplay = true;
        audio.muted = false; // Ensure audio is not muted by default
        audio.controls = false;
        audio.style.display = 'none'; // Hide audio element
        videoPopup.appendChild(audio);

        // Sync audio with video
        video.addEventListener('play', () => audio.play());
        video.addEventListener('pause', () => audio.pause());
        video.addEventListener('seeked', () => (audio.currentTime = video.currentTime));
        video.addEventListener('timeupdate', () => {
          if (Math.abs(video.currentTime - audio.currentTime) > 0.3) {
            audio.currentTime = video.currentTime; // Resync if out of sync
          }
        });
      }

      // Resume video from last saved progress if source matches
      const savedData = JSON.parse(localStorage.getItem('videoProgress')) || {};
      if (savedData[videoSrc] && savedData[videoSrc].progress !== undefined) {
        video.currentTime = savedData[videoSrc].progress;
      }

      // Save video progress to local storage
      const saveProgress = () => {
        if (!isNaN(video.currentTime) && video.duration > 0) {
          const updatedData = JSON.parse(localStorage.getItem('videoProgress')) || {};
          updatedData[video.src] = { progress: video.currentTime };
          localStorage.setItem('videoProgress', JSON.stringify(updatedData));
        }
      };

      // Function to resume video from saved progress
      const resumeFromSavedProgress = () => {
        const savedData = JSON.parse(localStorage.getItem('videoProgress')) || {};
        if (savedData[video.src] && savedData[video.src].progress !== undefined) {
          video.currentTime = savedData[video.src].progress;
        }
      };

      video.addEventListener('timeupdate', saveProgress);
      video.addEventListener('ended', () => {
        const updatedData = JSON.parse(localStorage.getItem('videoProgress')) || {};
        delete updatedData[video.src]; // Remove progress for the ended video
        localStorage.setItem('videoProgress', JSON.stringify(updatedData));
      });

      // Add title on top-left of the video
      const title = document.createElement('div');
      title.textContent = videoTitle;
      title.style.position = 'absolute';
      title.style.top = '1em';
      title.style.left = '1em';
      title.style.color = 'white';
      title.style.textShadow = '2px 2px 4px rgba(0, 0, 0, 0.7)'; // Add text shadow for better visibility
      title.style.fontSize = '18px';
      title.style.fontWeight = 'bold';
      title.style.zIndex = '15';
      videoPopup.appendChild(title);

      // Add timeline on bottom-left
      const timeline = document.createElement('div');
      timeline.style.position = 'absolute';
      timeline.style.bottom = '2.5em';
      timeline.style.left = '2.2em';
      timeline.style.color = 'white';
      timeline.style.textShadow = '2px 2px 4px rgba(0, 0, 0, 0.7)'; // Add text shadow for better visibility
      timeline.style.fontSize = '14px';
      timeline.style.fontWeight = 'bold';
      timeline.style.zIndex = '15';
      timeline.textContent = '00:00 / 00:00';

      const formatTime = (time) => {
        const hours = Math.floor(time / 3600).toString().padStart(2, '0');
        const minutes = Math.floor((time % 3600) / 60).toString().padStart(2, '0');
        const seconds = Math.floor(time % 60).toString().padStart(2, '0');
        return `${hours}:${minutes}:${seconds}`;
      };

      video.addEventListener('timeupdate', () => {
        const currentTime = formatTime(video.currentTime);
        const duration = formatTime(video.duration || 0);
        timeline.textContent = `${currentTime} / ${duration}`;
      });

      videoPopup.appendChild(timeline);

      // Create custom controls container
      const controls = document.createElement('div');
      controls.style.position = 'absolute';
      controls.style.bottom = '10px';
      controls.style.width = '100%';
      controls.style.display = 'flex';
      controls.style.flexDirection = 'column';
      controls.style.alignItems = 'center';
      controls.style.zIndex = '10';

      // Add progress bar
      const progressBar = document.createElement('input');
      progressBar.type = 'range';
      progressBar.min = '0';
      progressBar.max = '100';
      progressBar.style.height = '0.2em';
      progressBar.value = '0';
      progressBar.style.width = '90%';
      progressBar.style.filter = 'drop-shadow(2px 2px 4px rgba(0, 0, 0, 0.75))'; // Add shadow for better visibility
      progressBar.style.marginBottom = '4em';
      progressBar.addEventListener('input', () => {
        video.currentTime = (progressBar.value / 100) * video.duration;
      });
      video.addEventListener('timeupdate', () => {
        progressBar.value = (video.currentTime / video.duration) * 100;
      });
      controls.appendChild(progressBar);

      // --- Download button (bottom right) ---
      let downloadButton = null;
      if (hasDownload) {
        downloadButton = document.createElement('a');
        downloadButton.href = videoSrc;
        downloadButton.download = '';
        downloadButton.target = '_blank';
        downloadButton.textContent = 'Download';
        downloadButton.style.position = 'absolute';
        downloadButton.style.bottom = '1em';
        downloadButton.style.right = '2em';
        downloadButton.style.padding = '0.5em 1.2em';
        downloadButton.style.backgroundColor = '#222';
        downloadButton.style.borderRadius = '1em';
        downloadButton.style.color = 'white';
        downloadButton.style.border = 'none';
        downloadButton.style.cursor = 'pointer';
        downloadButton.style.zIndex = '30';
        downloadButton.style.boxShadow = '2px 2px 8px rgba(0,0,0,0.7)';
        downloadButton.style.display = 'block';
        downloadButton.title = 'Download this video';
        videoPopup.appendChild(downloadButton);
      }

      // Create inline controls container
      const inlineControls = document.createElement('div');
      inlineControls.style.position = 'absolute';
      inlineControls.style.top = '50%';
      inlineControls.style.left = '50%';
      inlineControls.style.transform = 'translate(-50%, -50%)';
      inlineControls.style.display = 'flex';
      inlineControls.style.alignItems = 'center';
      inlineControls.style.zIndex = '20';

      // Add 10-second back button
      const backButton = document.createElement('button');
      backButton.innerHTML = '<i class="fi fi-rr-replay-10" style="font-size:2em;"></i>';
      backButton.style.marginRight = '2em';
      backButton.style.padding = '10px';
      backButton.style.backgroundColor = 'transparent';
      backButton.style.textShadow = '2px 2px 4px rgba(0, 0, 0, 0.7)'; // Add text shadow for better visibility
      backButton.style.color = 'white';
      backButton.style.border = 'none';
      backButton.style.cursor = 'pointer';
      backButton.addEventListener('click', () => {
        video.currentTime = Math.max(0, video.currentTime - 10);
      });
      inlineControls.appendChild(backButton);

      // Add play/pause button
      const playPauseButton = document.createElement('button');
      playPauseButton.innerHTML = '<i class="fi fi-sr-pause" style="color:white;font-size:3.5em;"></i>';
      playPauseButton.style.margin = '5px';
      playPauseButton.style.textShadow = '2px 2px 4px rgba(0, 0, 0, 0.7)'; // Add text shadow for better visibility
      playPauseButton.style.color = 'white';
      playPauseButton.style.padding = '2em';
      playPauseButton.style.backgroundColor = 'transparent';
      playPauseButton.style.border = 'none';
      playPauseButton.style.cursor = 'pointer';
      playPauseButton.addEventListener('click', () => {
        if (video.paused) {
          video.play();
          playPauseButton.innerHTML = '<i class="fi fi-sr-pause" style="color:white;font-size:3.5em;"></i>';
        } else {
          video.pause();
          playPauseButton.innerHTML = '<i class="fi fi-sr-play" style="color:white;font-size:3.5em;"></i>';
        }
      });
      inlineControls.appendChild(playPauseButton);

      // Add 10-second forward button
      const forwardButton = document.createElement('button');
      forwardButton.innerHTML = '<i class="fi fi-rr-time-forward-ten" style="font-size:2em;"></i>';
      forwardButton.style.marginLeft = '2em';
      forwardButton.style.padding = '10px';
      forwardButton.style.backgroundColor = 'transparent';
      forwardButton.style.textShadow = '2px 2px 4px rgba(0, 0, 0, 0.7)'; // Add text shadow for better visibility
      forwardButton.style.color = 'white';
      forwardButton.style.border = 'none';
      forwardButton.style.cursor = 'pointer';
      forwardButton.addEventListener('click', () => {
        video.currentTime = Math.min(video.duration, video.currentTime + 10);
      });
      inlineControls.appendChild(forwardButton);

      // Add Previous button on middle-left
      const prevButton = document.createElement('button');
      prevButton.innerHTML = '<i class="fi fi-rr-angle-left" style="font-size:2em;"></i>';
      prevButton.style.position = 'absolute';
      prevButton.style.top = '50%';
      prevButton.style.left = '2em';
      prevButton.style.transform = 'translateY(-50%)';
      prevButton.style.padding = '10px';
      prevButton.style.backgroundColor = 'transparent';
      prevButton.style.textShadow = '2px 2px 4px rgba(0, 0, 0, 0.7)'; // Add text shadow for better visibility
      prevButton.style.color = 'white';
      prevButton.style.border = 'none';
      prevButton.style.cursor = 'pointer';
      prevButton.style.zIndex = '20';
      prevButton.addEventListener('click', () => {
        if (currentIndex > 0) {
          currentIndex--;
          updateMediaSource(currentIndex);
          title.textContent = `${videoTitle} - Episode ${currentIndex + 1}`; // Update title with episode number
        }
      });
      videoPopup.appendChild(prevButton);

      // Add Next button on middle-right
      const nextButton = document.createElement('button');
      nextButton.innerHTML = '<i class="fi fi-rr-angle-right" style="font-size:2em;"></i>';
      nextButton.style.position = 'absolute';
      nextButton.style.top = '50%';
      nextButton.style.right = '2em';
      nextButton.style.transform = 'translateY(-50%)';
      nextButton.style.padding = '10px';
      nextButton.style.backgroundColor = 'transparent';
      nextButton.style.textShadow = '2px 2px 4px rgba(0, 0, 0, 0.7)'; // Add text shadow for better visibility
      nextButton.style.color = 'white';
      nextButton.style.border = 'none';
      nextButton.style.cursor = 'pointer';
      nextButton.style.zIndex = '20';
      nextButton.addEventListener('click', () => {
        if (currentIndex < videoLinks.length - 1) { // Use videoLinks.length to determine the limit
          currentIndex++;
          updateMediaSource(currentIndex);
          title.textContent = `${videoTitle} - Episode ${currentIndex + 1}`; // Update title with episode number
        }
      });
      videoPopup.appendChild(nextButton);

      // Remove innerHTML of Next and Previous buttons if only one video source exists
      if (urls.length === 1) {
        prevButton.innerHTML = '';
        nextButton.innerHTML = '';
      }

      // Update video and audio source on next/previous button click
      const updateMediaSource = (newIndex) => {
        currentIndex = newIndex;
        video.pause();
        video.src = videoLinks[currentIndex];
        video.load();
        if (audioSrc && audioLinks) { // Check if audioLinks exists before updating audio
          audio.pause();
          audio.src = audioLinks[currentIndex] || '';
          audio.load();
        }
        // Update download button href if present
        if (downloadButton) {
          downloadButton.href = videoLinks[currentIndex];
        }
        resumeFromSavedProgress();
        video.play();
      };

      // Append inline controls and video to popup
      videoPopup.appendChild(video);
      videoPopup.appendChild(inlineControls);
      videoPopup.appendChild(controls);
      document.body.appendChild(videoPopup);

      // Create loading indicator
      const loadingIndicator = document.createElement('div');
      loadingIndicator.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="4.5em" height="4.5em" viewBox="0 0 24 24"><path fill="none" stroke="#fff" stroke-dasharray="16" stroke-dashoffset="16" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3c4.97 0 9 4.03 9 9"><animate fill="freeze" attributeName="stroke-dashoffset" dur="0.2s" values="16;0"/><animateTransform attributeName="transform" dur="1.5s" repeatCount="indefinite" type="rotate" values="0 12 12;360 12 12"/></path></svg>';
      loadingIndicator.style.position = 'absolute';
      loadingIndicator.style.top = '50%';
      loadingIndicator.style.left = '50%';
      loadingIndicator.style.transform = 'translate(-50%, -50%)';
      loadingIndicator.style.color = 'white';
      loadingIndicator.style.textShadow = '2px 2px 4px rgba(0, 0, 0, 0.7)';
      loadingIndicator.style.fontFamily = 'Arial, sans-serif';
      loadingIndicator.style.fontSize = '20px';
      loadingIndicator.style.fontWeight = 'bold';
      loadingIndicator.style.zIndex = '25';
      loadingIndicator.style.display = 'none'; // Initially hidden
      videoPopup.appendChild(loadingIndicator);

      const showLoading = () => {
        loadingIndicator.style.display = 'block';
        title.style.display = 'none';
        timeline.style.display = 'none';
        controls.style.display = 'none';
        inlineControls.style.display = 'none';
        prevButton.style.display = 'none';
        nextButton.style.display = 'none';
        if (audioSrc) {
          audio.pause(); // Pause audio immediately when loading indicator is shown
        }
      };

      const hideLoading = () => {
        loadingIndicator.style.display = 'none';
        showControls(); // Show controls when loading is complete
        if (audioSrc && !video.paused) {
          audio.play(); // Resume audio if video is playing
        }
      };

      // Show loading indicator when video is loading or not started
      video.addEventListener('waiting', showLoading);
      video.addEventListener('canplay', hideLoading);
      video.addEventListener('canplaythrough', hideLoading);

      // Ensure loading indicator is shown initially if the video hasn't started
      if (video.readyState < 3) {
        showLoading();
      }

      // Request fullscreen for the entire popup
      if (videoPopup.requestFullscreen) {
        videoPopup.requestFullscreen();
      } else if (videoPopup.webkitRequestFullscreen) {
        videoPopup.webkitRequestFullscreen();
      } else if (videoPopup.mozRequestFullScreen) {
        videoPopup.mozRequestFullScreen();
      } else if (videoPopup.msRequestFullscreen) {
        videoPopup.msRequestFullscreen();
      }

      // Handle exit fullscreen
      const onFullscreenChange = () => {
        if (
          !document.fullscreenElement &&
          !document.webkitFullscreenElement &&
          !document.mozFullScreenElement &&
          !document.msFullscreenElement
        ) {
          video.pause();
          video.src = ''; // Clear video source
          if (document.body.contains(videoPopup)) {
            document.body.removeChild(videoPopup); // Ensure popup is removed
          }
          document.removeEventListener('fullscreenchange', onFullscreenChange);
          document.removeEventListener('webkitfullscreenchange', onFullscreenChange);
          document.removeEventListener('mozfullscreenchange', onFullscreenChange);
          document.removeEventListener('MSFullscreenChange', onFullscreenChange);
        }
      };

      document.addEventListener('fullscreenchange', onFullscreenChange);
      document.addEventListener('webkitfullscreenchange', onFullscreenChange);
      document.addEventListener('mozfullscreenchange', onFullscreenChange);
      document.addEventListener('MSFullscreenChange', onFullscreenChange);

      // Add exit fullscreen button on top-right
      const exitFullscreenButton = document.createElement('button');
      exitFullscreenButton.innerHTML = '<i class="fi fi-rr-cross" style="font-size:2em;"></i>';
      exitFullscreenButton.style.position = 'absolute';
      exitFullscreenButton.style.top = '1em';
      exitFullscreenButton.style.right = '1em';
      exitFullscreenButton.style.padding = '10px';
      exitFullscreenButton.style.backgroundColor = 'transparent';
      exitFullscreenButton.style.textShadow = '2px 2px 4px rgba(0, 0, 0, 0.95)'; // Add text shadow for better visibility
      exitFullscreenButton.style.color = 'white';
      exitFullscreenButton.style.border = 'none';
      exitFullscreenButton.style.cursor = 'pointer';
      exitFullscreenButton.style.zIndex = '20';
      exitFullscreenButton.addEventListener('click', () => {
        // Always remove popup after requesting exit fullscreen (iPhone fix)
        if (document.exitFullscreen) {
          document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen();
        } else if (document.mozCancelFullScreen) {
          document.mozCancelFullScreen();
        } else if (document.msExitFullscreen) {
          document.msExitFullscreen();
        }
        // Remove popup regardless of platform
        if (document.body.contains(videoPopup)) {
          document.body.removeChild(videoPopup);
        }
      });
      videoPopup.appendChild(exitFullscreenButton);

      // Lock and unlock controls
      let controlsLocked = false;
      const lockButton = document.createElement('button');
      lockButton.innerHTML = '<i class="fi fi-rr-lock" style="font-size:2em;"></i>';
      lockButton.style.position = 'absolute';
      lockButton.style.left = '50%';
      lockButton.style.bottom = '5em';
      lockButton.style.transform = 'translateX(-50%)';
      lockButton.style.padding = '10px';
      lockButton.style.backgroundColor = 'transparent';
      lockButton.style.textShadow = '2px 2px 4px rgba(0, 0, 0, 0.7)';
      lockButton.style.color = 'white';
      lockButton.style.border = 'none';
      lockButton.style.cursor = 'pointer';
      lockButton.style.zIndex = '20';
      lockButton.style.transition = 'opacity 0.2s';
      lockButton.style.opacity = '1';

      lockButton.addEventListener('click', (e) => {
        e.stopPropagation();
        controlsLocked = !controlsLocked;
        if (controlsLocked) {
          lockButton.innerHTML = '<i class="fi fi-sr-lock" style="font-size:2em;"></i>';
          hideControlsTimeout = null; // Clear the timeout to prevent hiding controls
          hideControls(); // Hide controls when locking
        } else {
          lockButton.innerHTML = '<i class="fi fi-rr-lock" style="font-size:2em;"></i>';
          showControls(); // Show controls when unlocking
        }
      });
      videoPopup.appendChild(lockButton);

      // Hide controls after 2 seconds of inactivity
      let hideControlsTimeout;

      const hideControls = () => {
        if (!video.paused) { // Do not hide controls if the video is paused
          title.style.display = 'none';
          timeline.style.display = 'none';
          controls.style.display = 'none';
          inlineControls.style.display = 'none';
          prevButton.style.display = 'none';
          nextButton.style.display = 'none';
          exitFullscreenButton.style.display = 'none';
          if (downloadButton) downloadButton.style.display = 'none';
          lockButton.style.opacity = '0'; // Hide lock button
        }
      };

      const showControls = () => {
        if (controlsLocked || loadingIndicator.style.display === 'block') {
          // Only show lock button when locked
          lockButton.style.opacity = '1';
          title.style.display = 'none';
          timeline.style.display = 'none';
          controls.style.display = 'none';
          inlineControls.style.display = 'none';
          prevButton.style.display = 'none';
          nextButton.style.display = 'none';
          exitFullscreenButton.style.display = 'none';
          if (downloadButton) downloadButton.style.display = 'none';
        } else {
          title.style.display = 'block';
          timeline.style.display = 'block';
          controls.style.display = 'flex';
          inlineControls.style.display = 'flex';
          prevButton.style.display = 'block';
          nextButton.style.display = 'block';
          exitFullscreenButton.style.display = 'block';
          if (downloadButton) downloadButton.style.display = 'block';
          lockButton.style.opacity = '1';
          resetHideControlsTimeout();
        }
      };

      const resetHideControlsTimeout = () => {
        clearTimeout(hideControlsTimeout);
        hideControlsTimeout = setTimeout(hideControls, 2000);
      };

      // Attach event listeners to show controls on interaction
      videoPopup.addEventListener('mousemove', () => {
        if (!controlsLocked) showControls();
        else lockButton.style.opacity = '1';
        resetHideControlsTimeout();
      });
      videoPopup.addEventListener('click', () => {
        if (!controlsLocked) showControls();
        else lockButton.style.opacity = '1';
        resetHideControlsTimeout();
      });
      videoPopup.addEventListener('touchstart', () => {
        if (!controlsLocked) showControls();
        else lockButton.style.opacity = '1';
        resetHideControlsTimeout();
      });

      // Start the timeout to hide controls
      resetHideControlsTimeout();

      video.addEventListener('pause', () => {
        showControls(); // Show controls when the video is paused
        clearTimeout(hideControlsTimeout); // Clear the timeout to prevent hiding
      });

      video.addEventListener('play', () => {
        resetHideControlsTimeout(); // Restart the timeout when the video plays
      });

      // Add double-click functionality for back and forward
      videoPopup.addEventListener('dblclick', (event) => {
        if (controlsLocked) return; // Prevent seek on lock
        const rect = video.getBoundingClientRect();
        const clickX = event.clientX - rect.left;

        if (clickX < rect.width / 2) {
          // Double-click on the left side triggers back button
          backButton.click();
        } else {
          // Double-click on the right side triggers forward button
          forwardButton.click();
        }
      });

      // Add pinch-to-zoom functionality
      let initialPinchDistance = null;
      let isFitMode = false; // Track fit mode state

      const calculateDistance = (touch1, touch2) => {
        const dx = touch1.clientX - touch2.clientX;
        const dy = touch1.clientY - touch2.clientY;
        return Math.sqrt(dx * dx + dy * dy);
      };

      const handlePinchStart = (event) => {
        if (event.touches.length === 2) {
          initialPinchDistance = calculateDistance(event.touches[0], event.touches[1]);
        }
      };

      const handlePinchMove = (event) => {
        if (event.touches.length === 2 && initialPinchDistance !== null) {
          const currentPinchDistance = calculateDistance(event.touches[0], event.touches[1]);

          if (currentPinchDistance > initialPinchDistance * 1.2) {
            // Pinch out (zoom in)
            if (!isFitMode) {
              video.style.objectFit = 'cover'; // Fit mode
              isFitMode = true;
            }
            initialPinchDistance = currentPinchDistance; // Update pinch distance
          } else if (currentPinchDistance < initialPinchDistance * 0.8) {
            // Pinch in (zoom out)
            if (isFitMode) {
              video.style.objectFit = 'contain'; // Default mode
              isFitMode = false;
            }
            initialPinchDistance = currentPinchDistance; // Update pinch distance
          }
        }
      };

      const handlePinchEnd = () => {
        initialPinchDistance = null; // Reset pinch distance on touch end
      };

      video.addEventListener('touchstart', handlePinchStart);
      video.addEventListener('touchmove', handlePinchMove);
      video.addEventListener('touchend', handlePinchEnd);
      video.addEventListener('touchcancel', handlePinchEnd);
    };

    // Do not call createVideoPopup here; only call it from the play button click event
  }
};

// Wait for netflee-data.js to load and define window.getNetfleeBySlot
function waitForNetfleeDataAndInit() {
  if (typeof window.getNetfleeBySlot === 'function') {
    setupVideoPopup();

    // Load wishlist from localStorage on page load
    const watchlistDiv = document.querySelector('.watchlist');
    if (watchlistDiv) {
      const savedWatchlist = localStorage.getItem('watchlist');
      if (savedWatchlist) {
        watchlistDiv.innerHTML = savedWatchlist;
      }
    }
  } else {
    setTimeout(waitForNetfleeDataAndInit, 50);
  }
}

document.addEventListener('DOMContentLoaded', waitForNetfleeDataAndInit);

// Remove or comment out the old DOMContentLoaded block:
// document.addEventListener('DOMContentLoaded', () => {
//   setupVideoPopup();
//   // ...existing code...