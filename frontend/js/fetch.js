var fetchTrending = new Vue({
    el: "#body",
    data: {
        defaultUrl: window.location.href,
        defaultTitle: document.getElementsByTagName("title")[0].innerHTML,
        trendingPostsContainer: [],
        latestPostsContainer: [],
        topPost: null,
        userAgent: 'unixporn-love',
        topURL: 'https://www.reddit.com/r/unixporn/top/.json?count=20',
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
        modalComment: ""
    },
    methods: {
        fetchData: function() {
            // Fetch the post data from reddit
            fetch(this.topURL, {
                headers: {
                    'User-Agent': this.userAgent}
                })
                .then(response => {return response.json()})
                .then((jsonData) => {
                    // Parse the data and store it in the container
                    let data = jsonData["data"]["children"]
                    this.topPost = data[0]
                    data.splice(0, 1)
                    this.trendingPostsContainer = data

                    // Change the loaded to true
                    this.isTopLoaded = true
                })
        },
        fetchLatest: function(){
            // Fetch the latest posts using the latestURL

            fetch(this.latestURL, {
                headers: {
                    'User-Agent': this.userAgent
                }
            })
            .then(response => {return response.json()})
            .then(jsonData => {
                // Parse the json data
                let data = jsonData["data"]["children"]
                data.splice(0, 1)
                this.latestPostsContainer = data

                // Change to loaded
                this.isLatestLoaded = true
            })
        },
        calcPercentage(data) {
            return (data.ups / (data.ups + data.downs) * 100)
        },
        getFullUri(permalink) {
            return "https://www.reddit.com/" + permalink
        },
        makeReadable(differenceInHours) {
            /**
             * Make the passed time readable
             * 
             * The passed value will be in hours and we need to
             * process it and accordingly return a day or hour(s)
             * value.
             */
            differenceInHours = Math.floor(differenceInHours)

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
                return (differenceInHours / 24) + " day"
            }
            else {
                // Probably the value is greater than 2 days
                return (differenceInHours / 24) + " days"
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

            differenceInHours = Math.abs(diffInMs) / 36e5

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
                slidesToShow: 4,
                slidesToScroll: 3,
                variableWidth: true,
                draggable: false,
                responsive: [{

                    breakpoint: 1024,
                    settings: {
                      slidesToShow: 5,
                      slidesToScroll: 4,
                    }
              
                  }, {
              
                    breakpoint: 830,
                    settings: {
                      slidesToShow: 4,
                      slidesToScroll: 3,
                    }
              
                  }, {
              
                    breakpoint: 411,
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
            let commentsByAuthor = []
            fetch(postURL + ".json", {
                headers: {
                    'User-Agent': this.userAgent
                }
            })
            .then(response => {return response.json()})
            .then(jsonData => {
                comments = jsonData[1]["data"]["children"]
                comments.forEach(element => {
                    if (element["data"]["is_submitter"])
                        commentsByAuthor.push(element)
                });
                commentsByAuthor.forEach(element => {
                    console.log(element["data"]["body"])
                })
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
            this.modalImgSrc = container["url"]
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
            MicroModal.init()
            MicroModal.show("modal-top", {
                onShow: () => {
                    // Change the title and url of the page
                    this.updateTitleUrl(this.topPost.data.title)
                },
                onClose: () => {
                    this.resetTitleUrl()
                },
                disableScroll: true,
                awaitCloseAnimation: true,
                disableFocus: true
            })
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
        getModalImg: function() {
            return this.modalImgSrc
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
        // Initiate the modal
        //MicroModal.init()
    }
})