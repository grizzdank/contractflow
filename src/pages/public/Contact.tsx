import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";
import PublicNavigation from "@/components/PublicNavigation";
import Footer from "@/components/Footer";

const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    console.log("Submitting to Formspree:", formData);

    try {
      const response = await fetch("https://formspree.io/f/mrbqbppg", {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        console.log("Formspree submission successful");
        toast({
          title: "Message Sent!",
          description: "Thank you for contacting us. We'll get back to you shortly.",
        });
        setFormData({ name: "", email: "", company: "", message: "" }); // Reset form on success
      } else {
        // Try to parse error from Formspree if possible
        let errorMessage = "An error occurred during submission.";
        try {
            const errorData = await response.json();
            errorMessage = errorData.errors?.map((err: any) => err.message).join(", ") || errorMessage;
        } catch (parseError) {
            console.error("Could not parse Formspree error response", parseError);
        }
        console.error("Formspree submission failed:", response.statusText, errorMessage);
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      console.error('Error submitting contact form:', error);
      toast({
        title: "Error Sending Message",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 via-white to-orange-50">
      <PublicNavigation />
      <div className="max-w-7xl mx-auto px-6 pt-24 pb-16 flex items-center justify-center">
        <div className="max-w-lg w-full space-y-8 bg-white/80 backdrop-blur-sm p-8 rounded-lg shadow-lg">
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-emerald-700 to-orange-600 bg-clip-text text-transparent">
              Contact Us
            </h1>
            <p className="mt-2 text-gray-600">
              Have questions about features or pricing? Let us know!
            </p>
          </div>
          <form onSubmit={handleContactSubmit} className="space-y-4">
            <Input
              type="text"
              name="name"
              placeholder="Your Name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full"
            />
            <Input
              type="email"
              name="email"
              placeholder="Your Email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full"
            />
            <Input
              type="text"
              name="company"
              placeholder="Company Name (Optional)"
              value={formData.company}
              onChange={handleChange}
              className="w-full"
            />
            <Textarea
              name="message"
              placeholder="Your Message"
              value={formData.message}
              onChange={handleChange}
              required
              rows={4}
              className="w-full"
            />
            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Sending..." : "Send Message"}
            </Button>
          </form>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ContactPage; 