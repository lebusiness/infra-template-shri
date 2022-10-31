/* eslint-disable*/
// !!!!!
// git tag rc-0.0.*
// git push origin rc-0.1.*

const axios = require("axios");

let { GITHUB_TOKEN, OAUTH_TOKEN, ORG_ID, tag_name } = process.env;
let curTag = tag_name;

const repositoryUrl = "https://api.github.com/repos/lebusiness/infra-template-shri";
const headersGit = {
  headers: { Authorization: GITHUB_TOKEN },
};
const headersTracker = {
  "Content-Type": "application/json;charset=utf-8",
  Authorization: `OAuth ${OAUTH_TOKEN}`,
  "X-Org-ID": ORG_ID,
};

const postRelease = async () => {
  let prevTag;
  try {
    prevTag = await axios.get(repositoryUrl + "/releases/latest", headersGit);
  } catch {
    prevTag = null;
  }
  let responce;

  if (!prevTag) {
    responce = await axios.get(repositoryUrl + "/commits", headersGit);
    responce = responce.data;
    console.log('prev-tag: ', null);
    console.log("all commits", responce);
  } else {
    responce = await axios.get(
      repositoryUrl + `/compare/${prevTag.data.tag_name}...${curTag}`,
      headersGit
    );
    responce = responce.data.commits;
    console.log('prev-tag: ', prevTag.data.tag_name);
    console.log("after last release commits", responce);
  }
  let releaseAuthor;
  if (!prevTag) {
    releaseAuthor = responce[0].author.login;
  } else {
    releaseAuthor = responce.at(-1).author.login;
  }

  const releaseVersion = curTag.split("/").at(-1);
  const date = new Date();
  const releaseDate = `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
  console.log(releaseVersion, releaseDate);
  let result = `Ответственный за релиз: ${releaseAuthor}\n Коммиты, попавшие в релиз:\n`;
  responce.forEach((commit) => {
    result += `${commit.sha} ${commit.commit.author.name} ${commit.commit.message}\n`;
  });

  axios("https://api.tracker.yandex.net/v2/issues/HOMEWORKSHRI-185", {
    method: "patch",
    headers: headersTracker,
    data: {
      summary: `Релиз ${releaseVersion} - ${releaseDate}`,
      description: result,
    },
  });

  axios("https://api.tracker.yandex.net/v2/issues/HOMEWORKSHRI-185/comments", {
    method: "post",
    headers: headersTracker,
    data: {
      text: `Собрали образ в тегом ${releaseVersion}`
    },
  });
};

postRelease();
