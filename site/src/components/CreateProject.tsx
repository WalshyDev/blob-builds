import { useState } from "react";
import CardGroup from "./card/CardGroup";
import Input from "./html/Input";
import Card from "./card/Card";
import clsx from "clsx";
import { H1 } from "./html/Headings";

// Define the types for the form data
interface ReleaseChannel {
  name: string;
  supportedVersions: string;
  dependencies?: string[];
  fileNaming?: string;
}

interface FormData {
  name: string;
  description: string;
  repoLink?: string;
  releaseChannels: ReleaseChannel[];
}

export default function ProjectForm() {
  const [releaseChannels, setReleaseChannels] = useState<ReleaseChannel[]>([
    { name: "", supportedVersions: "", dependencies: [], fileNaming: "$project.jar" },
  ]);

  const [formData, setFormData] = useState<FormData>({
    name: "",
    description: "",
    repoLink: "",
    releaseChannels: releaseChannels,
  });

  // Function to handle input change
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    index?: number,
    field?: keyof ReleaseChannel
  ) => {
    const { name, value } = e.target;

    if (typeof index === "number" && field) {
      const updatedChannels = [...releaseChannels];
      updatedChannels[index] = {
        ...updatedChannels[index],
        [field]: name === "dependencies" ? value.split(",").map(dep => dep.trim()) : value,
      };
      setReleaseChannels(updatedChannels);
      setFormData({ ...formData, releaseChannels: updatedChannels });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const addReleaseChannel = () => {
    const newChannel = { name: "", supportedVersions: "", dependencies: [], fileNaming: "$project.jar" };
    const updatedChannels = [...releaseChannels, newChannel];

    setReleaseChannels(updatedChannels);
    setFormData({ ...formData, releaseChannels: updatedChannels });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    try {
      const response = await fetch("https://localhost/api/projects/" + formData.name + "/new", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert("Form submitted successfully!");
      } else {
        alert("There was an error submitting the form.");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred during submission.");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
        <CardGroup>
            <Card title='Project Name:'>
                <Input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                />
            </Card>

            {/* Description input */}
            <Card title='Project Description:'>
                <textarea
                id="description"
                name="description"
                className={clsx(
					'w-full p-2 rounded border border-default bg-default',
					'pl-10'
				)}
                value={formData.description}
                onChange={handleInputChange}
                required
                />
            </Card>

            <Card title="Repository Link (optional):">
                <Input
                type="url"
                id="repoLink"
                name="repoLink"
                value={formData.repoLink}
                onChange={handleInputChange}
                />
            </Card>
        </CardGroup>
        
        <H1>Release Channels</H1>
        <br/><br/>
        
        <div id="releaseChannels">
            {releaseChannels.map((channel, index) => (
            <Card key={index} title={`Release Channel ${index}:`}>
                <Input label = "Channel Name"
                type="text"
                id={`releaseName${index}`}
                name={`releaseName${index}`}
                value={channel.name}
                onChange={(e) => handleInputChange(e, index, "name")}
                required
                />

                <Input label = "Supported Versions:"
                type="text"
                id={`supportedVersions${index}`}
                name={`supportedVersions${index}`}
                value={channel.supportedVersions}
                onChange={(e) => handleInputChange(e, index, "supportedVersions")}
                required
                />

                <Input label = "Dependencies (comma-separated, optional):"
                type="text"
                id={`dependencies${index}`}
                name={`dependencies${index}`}
                value={channel.dependencies?.join(", ") || ""}
                onChange={(e) => handleInputChange(e, index, "dependencies")}
                />

                <Input label = "File Naming (optional):"
                type="text"
                id={`fileNaming${index}`}
                name={`fileNaming${index}`}
                value={channel.fileNaming || "$project.jar"}
                onChange={(e) => handleInputChange(e, index, "fileNaming")}
                />
            </Card>
            ))}
        </div>

        <br/><br/><br/>
        <button className={clsx(
			'px-2 py-1',
			'border rounded border-zinc-600 hover:border-zinc-400 text-zinc-300',
            'bg-blue-600 hover:bg-blue-500'
		)} type="button" onClick={addReleaseChannel}>
            Add Another Release Channel
        </button>

        <button className={clsx(
			'px-2 py-1',
			'border rounded border-zinc-600 hover:border-zinc-400 text-zinc-300',
            'bg-blue-600 hover:bg-blue-500'
		)} type="submit" style={{float: "right"}}>Submit</button>
        <br/><br/><br/>
    </form>
  );
}