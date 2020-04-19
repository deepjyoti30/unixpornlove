var fetchTrending = new Vue({
    el: "#body",
    data: {
        trendingPostsContainer: [],
        latestPostsContainer: [],
        topPost: null,
        userAgent: 'unixporn-love',
        topURL: 'https://www.reddit.com/r/unixporn/top/.json?count=20',
        latestURL: 'https://www.reddit.com/r/unixporn/.json?sort=new',
        isLatestLoaded: false,
        isTopLoaded: false,
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
            */
            createdTime = new Date(passedUTC * 1000)
            currentTime = new Date()

            differenceInHours = Math.abs(currentTime - createdTime) / 36e5

            // Return the value in a readable format
            return this.makeReadable(differenceInHours)
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