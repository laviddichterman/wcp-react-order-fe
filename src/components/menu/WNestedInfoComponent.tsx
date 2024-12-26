import React, { useState, useEffect, useCallback, ReactNode } from 'react';
import { Box, Tab, Typography } from '@mui/material';
import { TabList, TabPanel, TabContext } from '@mui/lab'



interface InfoSection {
  menutitle: string, // just the title
  title?: string, // dunno
  content?: ReactNode, // optional explanation of this section
  subsections: InfoSection[] // subcontent for this section
};

const NestedInfoData: InfoSection = {
  menutitle: "Frequently Asked Questions",
  subsections: [
    {
      menutitle: "About us",
      subsections: [
        {
          menutitle: "Who are we?",
          subsections: [],
          content: (<div>
            <Typography variant="h6">Windy City Pie</Typography>
            <Typography variant="body1">We are a Seattle-based pizza company specializing in Chicago-style deep-dish and tavern-style thin-crust pizzas. We also offer a hybrid Chicago/Detroit pan pizza. Our pizzas are made with a long-ferment sourdough crust, a blend of Wisconsin Brick Cheese and Mozzarella, and a variety of toppings. We are not affiliated with any other pizza company with a similar name.</Typography>
          </div>),
        }
      ]
    },
    {
      menutitle: "Pizza Taxonomy and How To Classify Our Pizzas",
      subsections: [
        {
          menutitle: "Where we fit in that landscape.",
          subsections: [],
          content: (
            <div>We offer three styles of pizza:
              <ul>
                <li><Typography variant="h6">Windy City Pie Chicago-Style Deep-Pan Deep-Dish Pizza</Typography>Our deep pan pizzas are inspired by the enriched, spongier, sweeter crust of Papa Del's (in Champaign/Urbana) and the caramelized (well... it's technically Maillard browned) cheese edge and balance of Burt Katz's Pequod's and Burt's Place.</li>
                <li><Typography variant="h6">Windy City Pie Chicago-Style Thin-Crust (aka Tavern-style) Pizza</Typography>Our tavern-style thin crust pizzas take inspiration from the dough 'curing' technique pioneered by Pat's Pizza and then perfected by Kim's Uncle in Westmont while holding a lot of admiration for the pizzas at Vito &amp; Nick's.</li>
                <li><Typography variant="h6">Breezy Town Pizza Hybrid Chicago/Detroit Pan Pizza</Typography>This style isn't trying to be authentic anything. Inspired by a 2017 visit to Paulie Gee's in Logan Square, it was born out of seeing how incredibly similar Chicago and Detroit pan pizzas are to one another. This style uses a long-ferment sourdough crust, a blend of Wisconsin Brick Cheese and Mozzarella, less sauce and a different layering of toppings than our other deep-dish offering. It's round, unlike Detroit-style pizza, only because we didn't want to buy new pans.</li>
              </ul>
</div>),
        },
        {
          menutitle: "The Chicago Pizza Landscape, according to us",
          subsections: [],
          content: (<div>Chicago Pizza taxonomy is a touchy subject and your classification of pizza styles and pizza in general might differ from ours. Here's our interpretation of the Chicago-style landscape with examples of restaurants that make them:
            <ul>
              <li>Deep-Dish
                <ul>
                  <li>Traditional (e.g. Lou Malnati's, My Pi, Pizzeria Uno, Pizzeria Due, Gino's East, Pizano's, Bartoli's Pizzeria)</li>
                  <li>Deep Pan (e.g. Pequod's, Burt's Place, Labriola Chicago, Milly's Pizza In The Pan, George's Deep-Dish)</li>
                  <li>Stuffed (e.g. Giordano's, The Art of Pizza, Bacino’s, Edwardo’s, Nancy's)</li>
                </ul>
              </li>
              <li>Thin Crust (aka Tavern-Style)
                <ul>
                  <li>Traditional (e.g. Vito &amp; Nick's, Phil's Pizza, Candelite, Marie's Pizza &amp; Liquors)</li>
                  <li>'Cured' (e.g. Pat's Pizza, Kim's Uncle, Crust Fund Pizza)</li>
                  <li>Pastry (e.g. Barnaby's, Home Run Inn)</li>
                </ul>
              </li>
              <li>Pizza Puffs</li>
            </ul>
            Yes, Pizza Puffs were invented in Chicago and no we're not influenced by them.</div>),
        },
      ]
    },
    {
      menutitle: "Ordering, Dining In, and Reservations",
      content: `Lorem ipsunsamdsdkjnadkjsdancsdkajn`,
      subsections: []
    },
    {
      menutitle: "Pizza Reheating Instructions",
      subsections: [
        {
          menutitle: "Deep-Pan Deep-Dish Pizza Reheating",
          content: `Lorem ipsunsamdsdkjnadkjsdancsdkajn`,
          subsections: []
        }
      ]
    }
  ]
}

function TabbedInfoSection({ data }: { data: InfoSection }) {
  const [value, setValue] = useState("0");
  const handleChange = (event: React.SyntheticEvent, newValue: string) => {
    setValue(newValue);
  };
  return <Box>
    {data.content ? data.content : <></>}
    {data.subsections.length > 0 ?
      <TabContext value={value}>
        <TabList onChange={handleChange} aria-label="tabs">
          {data.subsections.map((section, index) => <Tab key={index} label={section.menutitle} value={index.toString()} />)}
        </TabList>
        {data.subsections.map((section, index) => <TabPanel key={index} value={index.toString()}>{<TabbedInfoSection data={section} />}</TabPanel>)}
      </TabContext> : <></>}
  </Box>
}

export default function WNestedInfoComponent() {
  return <TabbedInfoSection data={NestedInfoData} />


}