var fetchTrending = new Vue({
    el: "#body",
    data: {
        isLoading: true,
        cookieName: 'current-theme',
        defaultUrl: window.location.href,
        defaultTitle: document.getElementsByTagName("title")[0].innerHTML,
        trendingPostsContainer: [],
        latestPostsContainer: [],
        topPost: null,
        userAgent: 'unixporn-love',
        topURL: 'https://www.reddit.com/r/unixporn/top/.json',
        latestURL: 'https://www.reddit.com/r/unixporn/new/.json',
        isLatestLoaded: false,
        isTopLoaded: false,
        // Modal related data below
        modalTitle: "",
        modalImgSrc: "",
        modalUps: "",
        modalHoursGone: "",
        modalURL: "",
        modalHeaderTitle: "",
        modalAuthor: "",
        modalCommentsNum: "",
        modalComment: "",
        isCommentLoading: true,
        showModalComment: false,
        modalPostHint: "",
        modalVideoSrc: "",
        modalEmbedSrc: "",
        isModalDomainValid: false,
        isEmbedShowable: false
    },
    methods: {
        filterDiscussion: function(container) {
            /**
             * Filter all the link_flair_text with Discussion
             */
            let filteredContainer = []
            container.forEach(element => {
                if (element['data']['link_flair_text'] != 'Discussion')
                    filteredContainer.push(element)
            })
            return filteredContainer
        },
        fetchData: function() {
            // Fetch the post data from reddit
            fetch(this.topURL, {
                })
                .then(response => {return response.json()})
                .then((jsonData) => {
                    // Parse the data and store it in the container
                    let data = jsonData["data"]["children"]
                    this.topPost = this.filterTopPost(data[0])
                    data.splice(0, 1)
                    this.trendingPostsContainer = this.filterDiscussion(data)

                    // Change the loaded to true
                    this.isTopLoaded = true
                    this.loadingComplete()
                    this.checkTheme()
                })
        },
        fetchLatest: function(){
            // Fetch the latest posts using the latestURL

            fetch(this.latestURL, {
            })
            .then(response => {return response.json()})
            .then(jsonData => {
                // Parse the json data
                let data = jsonData["data"]["children"]
                data.splice(0, 1)
                this.latestPostsContainer = this.filterDiscussion(data)

                // Change to loaded
                this.isLatestLoaded = true
            })
        },
        filterTopPost(topPost) {
            /**
             * Sometimes reddit just returns null for the top
             * post flair class, this class is responsible for
             * the color of the flair background.
             * 
             * In case it is null, just use the link_flair_text
             * and update link_flair_css_class.
             */
            if (topPost["data"]["link_flair_css_class"] == null) {
                // Convert the string to lower
                topPost["data"]["link_flair_css_class"] = topPost["data"]["link_flair_text"].toLowerCase()
            }
            return topPost
        },
        calcPercentage(data) {
            return (data.ups / (data.ups + data.downs) * 100)
        },
        getFullUri(permalink) {
            return "https://www.reddit.com" + permalink
        },
        makeReadable(differenceInHours) {
            /**
             * Make the passed time readable
             * 
             * The passed value will be in hours and we need to
             * process it and accordingly return a day or hour(s)
             * value.
             */
            if (differenceInHours < 2) {
                // Just return the hours if less than 24
                return differenceInHours + " hour"
            }
            else if (differenceInHours < 24) {
                // Return the hour but with a s in the 
                // hour
                return differenceInHours + " hours"
            }
            else if (differenceInHours < 48) {
                // Return the value in terms of day
                return Math.floor(differenceInHours / 24) + " day"
            }
            else {
                // Probably the value is greater than 2 days
                return Math.floor(differenceInHours / 24) + " days"
            }
        },
        getDiffHours(passedUTC) {
            /** Return the differnce in hours between the passed time
             * and the current time.
             *
             * One assumption made is that a particular post cannot become
             * a top post without being around for a while, so we'll 
             * assume that this method never returns a value less than 1
             * 
             * Assumption above is overruled since we are also calculating
             * time difference for latest posts now.
            */
            createdTime = new Date(passedUTC * 1000)
            currentTime = new Date()
            diffInMs = currentTime - createdTime

            differenceInHours = Math.floor(Math.abs(diffInMs) / 36e5)

            // If the value is greater than 0, return
            if (differenceInHours > 0)
                // Return the value in a readable format
                return this.makeReadable(differenceInHours)

            // Calculate the mins and accordingly return
            differenceInMins = Math.floor(Math.abs(((diffInMs % 86400000) % 3600000) / 60000))

            if (differenceInMins < 2)
                return differenceInMins + " minute"
            else
                return differenceInMins + " minutes"
        },
        initSlick: function(element) {
            // Initiate the slick containers
            $(element).not('.slick-initialized').slick({
                infinite: false,
                slidesToShow: 5,
                slidesToScroll: 4,
                variableWidth: true,
                draggable: false,
                responsive: [{
                    breakpoint: 1378,
                    settings: {
                        slidesToShow: 4,
                        slidesToScroll: 3
                    }

                  }, {
              
                    breakpoint: 1061,
                    settings: {
                      slidesToShow: 3,
                      slidesToScroll: 2,
                    }
              
                  }, {
              
                    breakpoint: 736,
                    settings: {
                        slidesToShow: 2,
                        slidesToScroll: 1
                    }
              
                  }
                ]
            })
        },
        formatTitleToUrl(title) {
            /**
             * Format the passed title to an URL
             * 
             * Remove the [ ] and replace all the spaces with a hyphen
             */
            let formattedTitle = title.replace(/ /g, "-")
            formattedTitle = formattedTitle.replace(/\[|\]/g, '')
            return formattedTitle + '/'
        },
        resetTitleUrl() {
            // Reset the title and URL to the default value
            document.title = this.defaultTitle
            history.pushState({id: 'homepage'}, this.defaultTitle, this.defaultUrl)
        },
        updateTitleUrl(title) {
            /**
             * Update the title and url of the page once the user clicks on 
             * a particular card
             */
            titleToShow =  this.defaultTitle + " | " + title
            document.title = titleToShow
            formattedUrl = this.formatTitleToUrl(title)
            history.pushState({id: 'homepage'}, titleToShow, formattedUrl)
        },
        getComment(postURL) {
            /**
             * Try to get the comment by the user that contains
             * the dotfiles etc.
             * 
             * The comments can be got by making a JSON request to the
             * passed URL. Once that's done, the second element is the
             * comments container.
             * 
             * From this container, we will filter out all the top level comments
             * from the user. The comments are probably in markdown, we'll
             * use markedJS to format them.
             */
            this.isCommentLoading = true
            let commentsByAuthor = []
            fetch(postURL + ".json", {
            })
            .then(response => {return response.json()})
            .then(jsonData => {
                comments = jsonData[1]["data"]["children"]
                comments.forEach(element => {
                    if (element["data"]["is_submitter"])
                        commentsByAuthor.push(element)
                });

                // If no comments found return
                if (!commentsByAuthor.length) {
                    this.showModalComment = false
                    this.isCommentLoading = false
                    return false
                }
                
                this.showModalComment = true
                this.modalComment = marked(commentsByAuthor[0]["data"]["body"])
            })
        },
        showModal(indexToShow, dataContainer) {
            /**
             * Show the data related to the post clickde on.
             */
            // Put a check to see if index is valid
            if (indexToShow > dataContainer.length - 1)
                return false

            // Update the title
            let container = dataContainer[indexToShow]["data"]
            this.modalTitle = container["title"]
            this.modalPostHint = container["post_hint"]
            console.log(container["domain"] + "me" + this.isModalDomainValid)
            if (container["domain"] == "imgur.com")
                this.isModalDomainValid = true
            else {
                this.isModalDomainValid = false
                this.isEmbedShowable = false
            }
            

            // Check if the post is a video or image and accordingly
            // get the sources
            if (this.modalPostHint == "image")
                this.modalImgSrc = container["url"]
            else if (this.modalPostHint == "hosted:video")
                this.modalVideoSrc = container["media"]["reddit_video"]["fallback_url"]
            else if (this.modalPostHint == "rich:video" || (this.modalPostHint == 'link' && this.isModalDomainValid)){
                let src = container["secure_media_embed"]["media_domain_url"]
                let width = container["secure_media_embed"]["width"]
                let height = container["secure_media_embed"]["height"]
                let scrolling = (container["scrolling"] ? "yes" : "no")
                this.modalEmbedSrc = '<iframe src="'
                                     + src
                                     + '" width="'
                                     + width
                                     + '" height="'
                                     + height
                                     + '" scrolling="'
                                     + scrolling
                                     + '">'
                this.isEmbedShowable = true
            }

            this.modalUps = container["ups"]
            this.modalHoursGone = this.getDiffHours(container["created_utc"])
            this.modalURL = this.getFullUri(container["permalink"])
            this.modalAuthor = "u/" + container["author"]
            this.modalCommentsNum = container["num_comments"]
            this.getComment(this.modalURL)

            MicroModal.init()
            MicroModal.show("modal-1", {
                onShow: () => {
                    // Change the title and url of the page
                    this.updateTitleUrl(this.modalTitle)
                },
                onClose: () => {
                    this.resetTitleUrl()
                    this.showModalComment = false
                },
                disableScroll: true,
                awaitCloseAnimation: true,
                disableFocus: true
            })
            
        },
        popup(index, typeData) {
            /**
             * Handle the popup if the user clicks on the more details
             * button.
             * 
             * The passed index is the index of the typeData and can be
             * accordingly.
             */
            // Build the title header
            let ranking = -1
            typeData == "trending" ? ranking = index + 2 : ranking = index + 1
            this.modalHeaderTitle = "Currently #"
                                    + ranking
                                    + " in "
                                    + typeData[0].toUpperCase()
                                    + typeData.slice(1)

            if (typeData == "trending")
                // Show trending's index'd data
                this.showModal(index, this.trendingPostsContainer)
            else if (typeData == "latest")
                this.showModal(index, this.latestPostsContainer)
        },
        showTopImage() {
            /**
             * Show the trending posts image in a popup
             */

            // Get the comments for the top post
            this.getComment(this.getFullUri(this.topPost.data.permalink))

            MicroModal.init()
            MicroModal.show("modal-top", {
                onShow: () => {
                    // Change the title and url of the page
                    this.updateTitleUrl(this.topPost.data.title)
                },
                onClose: () => {
                    this.resetTitleUrl()
                    this.showModalComment = false
                },
                disableScroll: true,
                awaitCloseAnimation: true,
                disableFocus: true
            })
        },
        toDark(element) {
            /**
             * Make some changes to completely change the theme to dark
             * mode.
             * 
             * Change the stylesheets
             * Change the dark mode icon to light mode
             * Change the current-mode attr to dark
             */
            $('link[href="css/main.css"]').attr('href','css/main-dark.css')
            $('link[href="css/reddit.css"]').attr('href','css/reddit-dark.css')
            $('link[href="css/micromodal.css"]').attr('href','css/micromodal-dark.css')

            // Change the icon
            element.classList.remove('fa-moon')
            element.classList.remove('border-dark')
            element.classList.add('fa-sun')
            element.classList.add('border-light')

            element.setAttribute("current-mode", "dark")

            // Also update the cookie with the new mode
            this.updateCookie("dark")
        },
        toLight(element) {
            // Same function as toDark just opposite
            $('link[href="css/main-dark.css"]').attr('href','css/main.css')
            $('link[href="css/reddit-dark.css"]').attr('href','css/reddit.css')
            $('link[href="css/micromodal-dark.css"]').attr('href','css/micromodal.css')

            // Change the icon
            element.classList.remove('fa-sun')
            element.classList.remove('boredr-light')
            element.classList.add('fa-moon')
            element.classList.add('border-dark')

            element.setAttribute("current-mode", "light")

            // Also update the cookie with the new mode
            this.updateCookie("light")
        },
        toggleDarkMode() {
            /**
             * Toggle dark mode whe the button is clicked.
             */
            let darkModeId = "dark-mode-toggler"
            let darkModeBtn = document.getElementById(darkModeId)

            let currentMode = darkModeBtn.getAttribute("current-mode")
            
            if (currentMode == "light")
                this.toDark(darkModeBtn)
            else if (currentMode == "dark")
                this.toLight(darkModeBtn)
        },
        loadingComplete() {
            /**
             * This method is called when the loading is done
             * and we are ready to hide the loading animation.
             * 
             * Wait for a few seconds after the loading is done so that
             * the loading animation is shown for a while at least.
             */
            setTimeout(() => {
                this.isLoading = false
            }, 3000)
        },
        setDefaultCookie(cookieName) {
            // No cookie with the name current theme was found
            // Set the cookie and set it to light.
            Cookies.set(cookieName, 'light')
        },
        updateCookie(newValue) {
            // Update the value of the cookie with the 
            // passed value
            Cookies.set(this.cookieName, newValue)
        },
        checkCookie() {
            /**
             * Try to see if a cookie is defined for the 
             * theme. 
             * 
             * If not then create a new cookie and set it to
             * the current default theme which is dark mode.
             * 
             * Update the cookies every time the theme is toggled.
             */
            let currentCookieTheme = Cookies.get(this.cookieName)

            if (currentCookieTheme == undefined) {
                this.setDefaultCookie(this.cookieName)
            }

            // If it is not undefined, it will be either light
            if (currentCookieTheme == "light") {
                // No need to do anything since it's default
            }
            else if (currentCookieTheme == "dark") {
                this.toggleDarkMode()
            }
            else {
                // Probably someone screwed with the cookies
                this.setDefaultCookie(this.cookieName)
            }
        },
        checkTheme() {
            setTimeout(() => {
                this.checkCookie()
            }, 3500)
        }
    },
    computed: {
        getPosts: function() {
            if (this.trendingPostsContainer.length)
                return this.trendingPostsContainer
        },
        getTopPost: function() {
            if (this.topPost)
                return this.topPost
        },
        getLatestPosts: function() {
            if (this.latestPostsContainer.length)
                return this.latestPostsContainer
        },
        showTop: function() {
            return this.isTopLoaded
        },
        showLatest: function() {
            return this.isLatestLoaded
        },
        getModalTitle: function() {
            return this.modalTitle
        },
        getModalPostHint: function() {
            return this.modalPostHint
        },
        getModalVideoSrc: function() {
            return this.modalVideoSrc
        },
        getModalImg: function() {
            return this.modalImgSrc
        },
        getIsEmbedShowable: function() {
            return this.isEmbedShowable
        },
        getModalEmbedSrc: function() {
            return this.modalEmbedSrc
        },
        getModalUps: function() {
            return this.modalUps
        },
        getModalHours: function() {
            return this.modalHoursGone
        },
        getModalURL: function() {
            return this.modalURL
        },
        getModalHeaderTitle: function() {
            return this.modalHeaderTitle
        },
        getModalAuthor: function() {
            return this.modalAuthor
        },
        getNumComments: function() {
            return this.modalCommentsNum
        },
        getModalComment: function() {
            return this.modalComment
        },
        getShowModalComment: function() {
            return this.showModalComment
        },
        getIsCommentLoading: function() {
            return this.isCommentLoading
        },
        isBodyLoading: function() {
            return this.isLoading
        }
    },
    mounted() {
        this.fetchData()
        this.fetchLatest()
    },
    updated() {
        // Initialize slick for trending
        this.initSlick("#cards-container-trending")
        // Initialize latest posts
        this.initSlick("#cards-container-latest")
    }
})