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
        initSlick: function(element) {
            // Initiate the slick containers
            $(element).not('.slick-initialized').slick({
                infinite: false,
                slidesToShow: 4,
                slidesToScroll: 3,
                variableWidth: true,
                draggable: false,
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