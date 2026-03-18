// © 2023 Amazon Web Services, Inc. or its affiliates. All Rights Reserved.
// This AWS Content is provided subject to the terms of the AWS Customer Agreement available at
// http://aws.amazon.com/agreement or other written agreement between Customer and either
// Amazon Web Services, Inc. or Amazon Web Services EMEA SARL or both.
import React, { useEffect, useState } from "react";
import { Amplify } from "aws-amplify";
import { fetchAuthSession, signInWithRedirect, signOut } from "aws-amplify/auth";
import { Hub } from "aws-amplify/utils";
import { Spin, Layout } from "antd";
import awsconfig from "./aws-exports";
import Nav from "./components/Navigation/Nav";
import home from "./media/Home.svg";
import "./index.css";
import { Button } from "@awsui/components-react";

const { Header, Content } = Layout;

Amplify.configure(awsconfig);

function Home(props) {
  return (
    <Layout className="site-layout">
      <Header className="site-layout-background" style={{ padding: 0 }} />
      <Content className="layout">
        <Spin spinning={props.loading} size="large">
          <Button
            className="homebutton"
            variant="primary"
            onClick={() => signInWithRedirect()}
          >
            Federated Sign In
          </Button>
          <img src={home} alt="Homepage" className="home" />
        </Spin>
      </Content>
    </Layout>
  );
}
function App() {
  const [user, setUser] = useState(null);
  const [groups, setGroups] = useState(null);
  const [cognitoGroups, setcognitoGroups] = useState([]);
  const [userId, setUserId] = useState(null);
  const [groupIds, setGroupIds] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const hubListener = Hub.listen("auth", ({ payload }) => {
      // eslint-disable-next-line default-case
      switch (payload.event) {
        case "signInWithRedirect":
          console.log("User signed in");
          setData();
          break;
        case "signOut":
          console.log("User signed out");
          setLoading(false);
          break;
        case "signInWithRedirect_failure":
          console.log("Sign in failure");
          setLoading(false);
          break;
      }
    });

    setData();

    return () => hubListener();
  }, []);

  function setData() {
    getUser().then((session) => {
      if (!session) return;
      const idToken = session.tokens?.idToken;
      if (!idToken) {
        setLoading(false);
        return;
      }
      const payload = idToken.payload;
      setUser({ attributes: { email: payload.email }, signInUserSession: { idToken: { payload } } });
      setcognitoGroups(payload["cognito:groups"] || []);
      setUserId(payload.userId);
      setGroupIds(payload.groupIds ? String(payload.groupIds).split(',') : []);
      setGroups(payload.groups ? String(payload.groups).split(',') : []);
      setLoading(false);
    });
  }

  async function getUser() {
    try {
      const session = await fetchAuthSession();
      if (!session.tokens) {
        setLoading(false);
        return null;
      }
      return session;
    } catch {
      setLoading(false);
      console.log("Not signed in");
      return null;
    }
  }

  return (
    <div>
      {groups ? (
        <Nav
          user={user}
          groupIds={groupIds}
          userId={userId}
          groups={groups}
          cognitoGroups={cognitoGroups}
        />
      ) : (
        <Home loading={loading} />
      )}
    </div>
  );
}

export default App;
