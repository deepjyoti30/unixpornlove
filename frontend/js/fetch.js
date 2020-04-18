var fetchTrending = new Vue({
    el: "#body",
    data: {
        trendingPostsContainer: [],
        topPost: null,
        topURL: 'https://www.reddit.com/r/unixporn/top/.json?count=20'
    },
    methods: {
        fetchData: function() {
            // Fetch the post data from reddit
            fetch(this.topURL, {
                headers: {
                    'User-Agent': 'unixporn-app'}
                })
                .then(response => {return response.json()})
                .then((jsonData) => {
                    // Parse the data and store it in the container
                    let data = jsonData["data"]["children"]
                    this.topPost = data[0]
                    data.splice(0, 1)
                    this.trendingPostsContainer = data
                })
        },
        calcPercentage(data) {
            return (data.ups / (data.ups + data.downs) * 100)
        },
        getFullUri(permalink) {
            return "https://www.reddit.com/" + permalink
        },
    },
    computed: {
        getPosts: function() {
            return this.trendingPostsContainer
        },
        getTopPost: function() {
            if (this.topPost)
                return this.topPost
        },
    },
    mounted() {
        this.fetchData()
    },
    updated() {
        // Initialize slick
        $('#cards-container').slick({
            infinite: false,
            slidesToShow: 4,
            slidesToScroll: 3,
            variableWidth: true,
            draggable: false
        })
    }
})