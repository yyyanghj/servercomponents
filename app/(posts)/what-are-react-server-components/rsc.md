import ClientWaterfallDiagram from "./client-waterfall-diagram.tsx"
import ServerRenderingAnimation from "./server-rendering-animation.tsx"
import HydrationAnimation from "./hydration-animation.tsx"

# What are React Server Components (RSCs)?

React server components are React components that run *only* on the server, a different paradigm from the mental model we've grown accustomed to where React simply runs on the client (in the browser).

With this new paradigm, the main difference comes from the output of the component and where the component runs, not necessarily the way you build (at least not so much).

There's still a shift in the way you think about building React apps, but it's not as drastic as you might think, and the goal of this website is to explain what changed, why things changed, and how to think about building React apps with this new paradigm.

This site *is* completely open sourced, so if you're interested in adding anything, changing anything, correcting any mistakes, or just want to see how it works, you can check out the [repo on GitHub](https://github.com/ricardonunez-io/servercomponents).

### Server Side Rendering

Running React components on the server might seem familiar if you've heard of "server-side rendering" or SSR (a la [Next.js](https://nextjs.org) or [Remix](https://remix.run)), which is when you pre-render your React components on the *server*, and then *hydrate it* on the client.

What pre-rendering means is that we're essentially rendering your React component tree (pre-animations, pre-hooks, etc.) as HTML and sending it to the browser, using React's `renderToString(){:js}` method.

<ServerRenderingAnimation caption={"Press play for a rough visualization on what server-side rendering does."} />

That string of HTML might look something like this in a basic React app, and you can think of it as a screenshot of the very first frame you see when loading a page before any animations, state changes, effects, etc. happen. For example:

```js
`<html><head><title>My App</></head><body><div id="root"><div class="App"><h1>Hello World!</></div></div></body></html>`
```

Here's the same thing, but formatted for readability:

```js
`<html>
  <head>
    <title>My App</title>
  </head>
  <body>
    <div id="root">
      <div class="App">
        <h1>Hello World!</h1>
      </div>
    </div>
  </body>
</html>`
```

This string of HTML is then sent to the browser to render, and then *hydrated* by React once the browser loads React and all the necessary Javascript.

Now, while frameworks like Next and Remix are widely known for their capabilities in server rendering your React app, it's not quite the same as *running* a React component on the server, because there's still the step of hydration.

"Hydration" essentially means re-rendering all of that HTML, *plus* the necessary JS in the user's *browser* so that the page can become interactive.

So even though SSR means that your user sees your content on their screen, it doesn't mean they can use the page yet.

React still has to do a lot of work in terms of binding your React components from the virtual DOM to the actual DOM, setting up event listeners/handlers, etc.

<HydrationAnimation caption={"↑ React needs to bind these things to your application behind the scenes before anything on the page can be interacted with (i.e. before you can navigate, click a button, etc.), even if the HTML is visible on the page."} />

Even if you have a completely static page with no hooks, state, effects, click handlers, etc., React would *still* need to hydrate the page, meaning your static HTML and CSS are bound by the loading of Javascript.

So the challenge SSR solved wasn't necessarily running React on servers to get rid of hydration, but rather giving the user content to look at while React loads up all the components.

### How are Server Components different from SSR?

Now, if hydration is still necessary using SSR, that means that your React logic (i.e. what gets called before the `return(){:js}` statement) still needs to run on the client.

This is because behind the scenes, Babel is transpiling your JSX into `React.createElement(){:js}` calls on the client-side.

These calls create React elements (JSON objects) that describe your components and tell the browser "these are the DOM nodes from the React virtual DOM that we'd like to add to the actual DOM".

So even if you server-side render your application, that initial HTML output is just going to be overwritten by the JSX's transpilation into `React.createElement(){:js}` calls which are going to paint over that HTML with the same HTML plus whatever data was fetched, and then finally, the HTML is going to be hydrated.

The difference between React Server Components and SSR is that instead of rendering a snapshot of your JSX's HTML output for the first load, and then creating elements to then *hydrate* that HTML, you're essentially shipping React components that have already been rendered as React elements (which, again, are object representations of the DOM and your component tree) and then shipping just those elements over to the browser.

Now, that's certainly a lot to keep track of, but Ryan Florence, one of the creators of [React Router](https://reactrouter.com) and [Remix](https://remix.run), had a great Tweet to explain this mental model:



For example, if we wanted to render a component that only contained a div that says "Hello World", in React, we'd simply write JSX like this:

```jsx
export default function HelloWorld() {
  return <div>Hello World</div>
}
```

The browser, however, won't get that JSX, nor will it get an HTML string like `"<div>Hello World</div>"{:js}`, but rather a React ***element*** that looks like this:

```json
{
  "type": "div",
  "props": {
    "children": "Hello World"
  }
}
```

This is what React uses on the *browser* to render your components, and it's what React Server Components use to render your components on the *server* and then *pass to the client* rather than passing JSX.

Because these components are, for all intents and purposes, static *once they're loaded*, they don't *need* to hydrate, but the benefit is that since it's running on the server, you have access to things like data fetching and file system access directly within components themselves.

So then, many people have the question: what happened to "regular React" or the React we all know?

Well, it's still there, but now, "regular" React components (i.e. React pre-Server Components) are called "client components".

Only the name changed, though, but they're exactly the same and nothing at all has changed about them in terms of functionality.

## The Problems They Solve

Great, so we can run React on the server, but why would we want to? What problems does this solve?

### Data Fetching

One of the biggest problems that RSCs solve has a lot to do with one of the novel ideas that led to React "winning" in the early framework wars, especially against frameworks like Angular, and that is unidrectional (one way) data flows.

In a React component tree, let's say you have a root component like the shell of a social media app and inside that shell, you have typical social media things like a feed of posts and a profile button. *(It's a very simple example, but it gets the point across)*

Now, let's say you want to fetch your profile data, your feed data, and your sidebar data. In a typical React app, you would have to do something like this:

```jsx
import { useState, useEffect } from "react";
import Profile from "./Profile";
import Feed from "./Feed";

export default function Shell() {
  const [profile, setProfile] = useState(null);
  const [feed, setFeed] = useState(null);

  useEffect(() => {
    fetch("/api/profile")
    .then((res) => res.json())
    .then((data) => setProfile(data));
  }, []);

  useEffect(() => {
    fetch(`/api/feed/${profile.id}`)
    .then((res) => res.json())
    .then((data) => setFeed(data));
  }, [profile.id]);

  return (
    <div>
      <Profile profile={profile} />
      <Feed feed={feed} />
    </div>
  );
}
```

Nothing too crazy going on here, and if you're used to React, this pattern may seem familiar.

We just have two effects, two state stores that are updated by those effects, and then once the data is fetched, we pass the data down as props from the shell to the components that need it, `<Profile>{:js}` and `<Feed>{:js}`.

Now, this is fine, but the big problem with this approach and what many developers have historically complained about is that we have to use `useEffect(){:js}` to fetch data, which means we have to think about how to trigger the fetch (i.e. on renders and re-renders), how to handle loading states, and how to handle errors in a more disconnected way to the components themselves since we're doing it all in the shell.

Also, worth noting is that we just introduced a larger than necessary waterfall into the application.

That is, we have to wait for the *profile* to be fetched before we can fetch the *feed*, and this back and forth between client and server:

<ClientWaterfallDiagram/>

means that the further away a client is from the server, the longer they're looking at a loading spinner because requests are bouncing back and forth between your user's browser, your server, and whatever your service (API, database, etc.) is hosted on.

Now, what if there's more data to load? What if we also want to get the user's likes, comments, and friends in an `<Activity />{:js}` component (one component to make it simple)?

Well, we'd have to add more effects, more state, and more props to pass down, but we can `Promise.all(){:js}` the requests to make sure they all resolve at the same time, right?

Well, that still doesn't get rid of that initial waterfall where we need to go back and forth between client and server to get the profile data first.

Also, in those extra components like likes, comments, and friends, we also need to get their own respective data like how many likes a post has, the most up-to-date comments, the most up-to-date friends list, etc., so even though we're only fetching 1 user's activity, we're also fetching each of those posts' data as well.

```jsx {4,9-11,25-40,46-50}
import { useState, useEffect } from "react";
import Profile from "./Profile";
import Feed from "./Feed";
import Activity from "./History";

export default function Shell() {
  const [profile, setProfile] = useState(null);
  const [feed, setFeed] = useState(null);
  const [likes, setLikes] = useState(null);
  const [comments, setComments] = useState(null);
  const [friends, setFriends] = useState(null);

  useEffect(() => {
    fetch("/api/profile")
    .then((res) => res.json())
    .then((data) => setProfile(data));
  }, []);

  useEffect(() => {
    fetch(`/api/feed/${profile.id}`)
    .then((res) => res.json())
    .then((data) => setFeed(data));
  }, [profile]);

  useEffect (() => {
    if (profile) {
      Promise.all([
        fetch(`/api/likes/${profile.id}`),
        fetch(`/api/comments/${profile.id}`),
        fetch(`/api/friends/${profile.id}`)
      ])
      .then((res) => Promise.all(res.map((r) => r.json())))
      .then(([likes, comments, friends]) => {
        setLikes(likes);
        setComments(comments);
        setFriends(friends);
      });
    }
  }, [profile]);

  return (
    <div>
      <Profile profile={profile} />
      <Feed feed={feed} />
      <Activity 
        likes={likes} 
        comments={comments} 
        friends={friends} 
      />
    </div>
  );
}
```

..... Continue here .....

So you can `async await{:js}` data directly in a component and pass that data down other server components or even "client components" as props.

While you technically *can* use async/await natively in the browser, there's a very specific reason why that doesn't exist in React "client components" (which are just standard React components).

With this model, you use a server for what it's good for, use the client/browser for reactivity, and get rid of using `useEffect(){:js}` for data fetching and storing server data in state.

Because of this, now you can build truly fullstack applications in a much more framework-agnostic way using only the primitives that React gives you.

This way, instead of writing the backend and frontend components and services in two different ways, the entire stack can be represented in a component tree.

You can directly access your database, interact with a database access layer, etc. and map the response from a request to an output (UI) to show to the user.

With traditional server-side technologies like PHP or Rails, a mutation or data request resulted in a hard reload where the entire page updates to show the updated data, which isn't ideal for cases where you need to preserve state, whereas with RSCs, you can retain state even with data requests or mutations occurring on a page.

Traditionally, client side apps (single-page-applications) allowed you to do client side routing and retain state while only updating the UI that needed to be changed, but you had to write the backend completely separately and map it to the UI while using some fairly inefficient models like `useEffect(){:js}` which often created network waterfalls and large Javascript bundles.

You would have to think about server-side data as state, think about how to trigger fetches, loading indications, and a lot more, because on the client side, you don't have as much flexibility to do those things safely without exposing sensitive data, services, or keys on the client.

With RSCs, you don't necessarily have to create publicly consumable APIs to map data to UI and update backend data, but you're still able to retain state and do client side routing while being able to effectively have dynamic, data driven applications.

Worth noting, however, is that RSCs don't necessarily rely on a "server", but are more so a specification for the component running ahead of time.

On Next.js, this means at build time, which allows you to do things like file system access for markdown files, but things like a comment section or theme-toggle could still be client components and interactive, as you can mix client and server components in your component tree seamlessly.

All in all, server components are a React take on how to do data fetching that is more similar to how you would do it in a traditional server-side app, and could possibly replace paradigms like getServerSideProps, Remix loaders, or Astro islands with a first-class supported solution.