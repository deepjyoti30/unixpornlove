var fetchTrending = new Vue({
    el: "#trending",
    data: {
        trendingPostsContainer: [],
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
                    this.trendingPostsContainer = jsonData["data"]["children"]
                })
        }
    },
    computed: {
        getPosts: function() {
            return this.trendingPostsContainer;
        }
    },
    mounted() {
        this.fetchData()
    }
})